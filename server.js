const express = require('express');
const path = require('path');
const os = require('os');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const MYSQL_HOST = process.env.MYSQL_HOST || '127.0.0.1';
const MYSQL_PORT = Number(process.env.MYSQL_PORT || 3306);
const MYSQL_USER = process.env.MYSQL_USER || 'root';
const MYSQL_PASSWORD = process.env.MYSQL_PASSWORD || '';
const MYSQL_DATABASE = process.env.MYSQL_DATABASE || 'case_management';

let pool;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public'), { etag: false, maxAge: 0 }));

async function initDatabase() {
  const initConn = await mysql.createConnection({
    host: MYSQL_HOST,
    port: MYSQL_PORT,
    user: MYSQL_USER,
    password: MYSQL_PASSWORD,
    multipleStatements: true
  });
  await initConn.query(`CREATE DATABASE IF NOT EXISTS \`${MYSQL_DATABASE}\``);
  await initConn.end();

  pool = mysql.createPool({
    host: MYSQL_HOST,
    port: MYSQL_PORT,
    user: MYSQL_USER,
    password: MYSQL_PASSWORD,
    database: MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    dateStrings: true
  });

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS items (
      id INT PRIMARY KEY AUTO_INCREMENT,
      category VARCHAR(100) NOT NULL,
      title VARCHAR(255) NOT NULL,
      client VARCHAR(255),
      contact VARCHAR(255),
      amount DECIMAL(20,2),
      received_amount DECIMAL(20,2),
      status VARCHAR(255),
      details TEXT,
      meta TEXT,
      images TEXT,
      created_at VARCHAR(50) NOT NULL,
      updated_at VARCHAR(50) NOT NULL
    )
  `);
}

function now() {
  return new Date().toISOString();
}

function parseMeta(value) {
  if (!value) return {};
  try {
    return typeof value === 'string' ? JSON.parse(value) : value;
  } catch (error) {
    return {};
  }
}

app.get('/api/categories', (req, res) => {
  res.json([
    { key: 'ongoing', label: '在办案件' },
    { key: 'leads', label: '客户线索' },
    { key: 'finance', label: '案件收款' },
    { key: 'financial_flow', label: '财务收支' },
    { key: 'reserve', label: '备用金收支' }
  ]);
});

app.get('/api/items', async (req, res) => {
  try {
    const category = req.query.category;
    const params = [];
    let sql = 'SELECT * FROM items';
    if (category) {
      sql += ' WHERE category = ?';
      params.push(category);
    }
    sql += ' ORDER BY updated_at DESC';
    const [rows] = await pool.execute(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/items/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [rows] = await pool.execute('SELECT * FROM items WHERE id = ?', [id]);
    const row = rows[0];
    if (!row) return res.status(404).json({ error: '未找到记录' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/summary', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM items ORDER BY updated_at DESC');
    const summary = {
      ongoingCount: 0,
      leadsCount: 0,
      financeCount: 0,
      financialFlowCount: 0,
      reserveCount: 0,
      financeTotal: 0,
      financeReceived: 0,
      flowIncome: 0,
      flowExpense: 0,
      reserveIncome: 0,
      reserveExpense: 0,
      reserveBalance: 0
    };
    rows.forEach((item) => {
      const meta = parseMeta(item.meta);
      if (item.category === 'ongoing') summary.ongoingCount += 1;
      if (item.category === 'leads') summary.leadsCount += 1;
      if (item.category === 'finance') {
        summary.financeCount += 1;
        const amountEntries = Array.isArray(meta.amount_entries) ? meta.amount_entries : [];
        summary.financeTotal += amountEntries.reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
        summary.financeReceived += Number(item.received_amount || 0);
      }
      if (item.category === 'financial_flow') {
        summary.financialFlowCount += 1;
        const amount = Number(meta.amount || 0);
        if (meta.flow_type === '收') {
          summary.flowIncome += amount;
        } else if (meta.flow_type === '支') {
          summary.flowExpense += amount;
        }
      }
      if (item.category === 'reserve') {
        summary.reserveCount += 1;
        summary.reserveIncome += Number(meta.income || 0);
        summary.reserveExpense += Number(meta.expense || 0);
      }
    });
    summary.reserveBalance = summary.reserveIncome - summary.reserveExpense;
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/items', async (req, res) => {
  try {
    const {
      category,
      title,
      amount,
      received_amount,
      details,
      meta,
      images
    } = req.body;
    const nowTs = now();

    if (!category || !title) {
      return res.status(400).json({ error: 'category 和 title 为必填项' });
    }

    const sql = `INSERT INTO items (category, title, amount, received_amount, status, details, meta, images, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const [result] = await pool.execute(sql, [
      category,
      title,
      amount || 0,
      received_amount || 0,
      '',
      details || '',
      JSON.stringify(meta || {}),
      JSON.stringify(images || []),
      nowTs,
      nowTs
    ]);

    const createdId = result.insertId;
    if (category === 'ongoing') {
      const linkedMeta = { linked_case_id: createdId, case_type: meta?.case_type || '' };
      const autoSql = `INSERT INTO items (category, title, amount, received_amount, status, details, meta, images, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      await pool.execute(autoSql, [
        'finance',
        title,
        0,
        0,
        '',
        '自动生成与在办案件关联的财务记录',
        JSON.stringify(linkedMeta),
        JSON.stringify([]),
        nowTs,
        nowTs
      ]);
    }

    const [rows] = await pool.execute('SELECT * FROM items WHERE id = ?', [createdId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/items/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const {
      category,
      title,
      client,
      contact,
      amount,
      received_amount,
      status,
      details,
      meta,
      images
    } = req.body;
    if (!category || !title) {
      return res.status(400).json({ error: 'category 和 title 为必填项' });
    }
    const nowTs = now();
    const sql = `UPDATE items SET category = ?, title = ?, client = ?, contact = ?, amount = ?, received_amount = ?, status = ?, details = ?, meta = ?, images = ?, updated_at = ? WHERE id = ?`;
    const [result] = await pool.execute(sql, [
      category,
      title,
      client || '',
      contact || '',
      amount || 0,
      received_amount || 0,
      status || '',
      details || '',
      JSON.stringify(meta || {}),
      JSON.stringify(images || []),
      nowTs,
      id
    ]);
    if (result.affectedRows === 0) return res.status(404).json({ error: '未找到记录' });
    const [rows] = await pool.execute('SELECT * FROM items WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/items/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [result] = await pool.execute('DELETE FROM items WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: '未找到记录' });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

initDatabase().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    const networkInterfaces = os.networkInterfaces();
    const localAddress = Object.values(networkInterfaces)
      .flat()
      .find((item) => item && item.family === 'IPv4' && !item.internal)?.address;

    console.log(`服务器已启动，访问 http://localhost:${PORT}`);
    if (localAddress) {
      console.log(`局域网访问地址: http://${localAddress}:${PORT}`);
    }
  });
}).catch((err) => {
  console.error('初始化失败', err);
  process.exit(1);
});
