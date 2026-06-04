const categoryTabs = document.getElementById('categoryTabs');
const summaryGrid = document.getElementById('summaryGrid');
const listPanel = document.getElementById('listPanel');
const detailPanel = document.getElementById('detailPanel');
const itemForm = document.getElementById('itemForm');
const dynamicFields = document.getElementById('dynamicFields');
const itemDetails = document.getElementById('itemDetails');
const itemImages = document.getElementById('itemImages');
const imagePreview = document.getElementById('imagePreview');
const formTitle = document.getElementById('formTitle');
const resetButton = document.getElementById('resetButton');
const openFormButton = document.getElementById('openFormButton');
const closeFormButton = document.getElementById('closeFormButton');
const floatingForm = document.getElementById('floatingForm');

let categories = [];
let activeCategory = 'ongoing';
let editingId = null;
let currentItems = [];
let currentImages = [];

const conditionalTriggers = ['investigation_agency', 'procuratorate', 'court_first', 'court_second', 'show_custody', 'show_detention', 'split_enabled'];
let conditionState = {};

function updateConditionState(values = {}) {
  const snapshot = getFieldValues(values);
  conditionalTriggers.forEach((key) => {
    conditionState[key] = Boolean(snapshot[key]);
  });
}

function shouldRerenderField(eventTarget) {
  const name = eventTarget.name;
  if (!conditionalTriggers.includes(name)) return false;
  const current = eventTarget.type === 'checkbox' ? eventTarget.checked : Boolean(eventTarget.value);
  if (conditionState[name] === current) return false;
  conditionState[name] = current;
  return true;
}

const caseTypeOptions = [
  { value: '刑事案件', label: '刑事案件' },
  { value: '非诉案件', label: '非诉案件' },
  { value: '顾问案件', label: '顾问案件' },
  { value: '民事案件', label: '民事案件' },
  { value: '行政案件', label: '行政案件' }
];

const categoryDefinitions = {
  ongoing: {
    label: '在办案件',
    fields: [
      { key: 'case_type', label: '案件类型', type: 'select', options: caseTypeOptions },
      { key: 'case_name', label: '案件名称', type: 'text' },
      { key: 'client', label: '委托人', type: 'text' },
      { key: 'client_contact', label: '委托人联系方式', type: 'text' },
      { key: 'procedure_stage', label: '程序阶段', type: 'text' },
      { key: 'investigation_agency', label: '侦查机关', type: 'text' },
      { key: 'investigation_contact', label: '联系人', type: 'text', condition: (v) => Boolean(v.investigation_agency) },
      { key: 'detention_date', label: '拘留时间', type: 'date', condition: (v) => Boolean(v.investigation_agency) },
      { key: 'arrest_date', label: '逮捕时间', type: 'date', condition: (v) => Boolean(v.investigation_agency) },
      { key: 'procuratorate', label: '公诉机关', type: 'text' },
      { key: 'procuratorate_contact', label: '联系人', type: 'text', condition: (v) => Boolean(v.procuratorate) },
      { key: 'transfer_date', label: '移送审查起诉时间', type: 'date', condition: (v) => Boolean(v.procuratorate) },
      { key: 'sentence_suggestion', label: '量刑建议', type: 'text', condition: (v) => Boolean(v.procuratorate) },
      { key: 'court_first', label: '一审法院', type: 'text' },
      { key: 'court_first_contact', label: '联系人', type: 'text', condition: (v) => Boolean(v.court_first) },
      { key: 'first_trial_date', label: '一审庭审时间', type: 'date', condition: (v) => Boolean(v.court_first) },
      { key: 'court_second', label: '二审法院', type: 'text' },
      { key: 'court_second_contact', label: '联系人', type: 'text', condition: (v) => Boolean(v.court_second) },
      { key: 'show_second_trial', label: '是否填写二审庭审时间', type: 'checkbox', condition: (v) => Boolean(v.court_second) },
      { key: 'second_trial_date', label: '二审庭审时间', type: 'date', condition: (v) => Boolean(v.court_second) && Boolean(v.show_second_trial) },
      { key: 'work_logs', label: '工作记录', type: 'work_log_table', className: 'field-full' },
      { key: 'case_summary', label: '案情简介', type: 'textarea', className: 'field-full' }
    ],
    genericVisibility: { title: false, client: false, contact: false, amount: false, status: true }
  },
  leads: {
    label: '客户线索',
    fields: [
      { key: 'case_type', label: '案件类型', type: 'select', options: caseTypeOptions },
      { key: 'source', label: '案件来源', type: 'text' },
      { key: 'person', label: '当事人', type: 'text' },
      { key: 'consultant', label: '咨询人', type: 'text' },
      { key: 'stage', label: '所处阶段', type: 'text' },
      { key: 'office', label: '办案单位', type: 'text' },
      { key: 'show_custody', label: '显示看守所', type: 'checkbox' },
      { key: 'custody', label: '看守所', type: 'text', condition: (v) => Boolean(v.show_custody) },
      { key: 'show_detention', label: '显示拘留时间', type: 'checkbox' },
      { key: 'detention_time', label: '拘留时间', type: 'date', condition: (v) => Boolean(v.show_detention) },
      { key: 'basic_case', label: '基本案情', type: 'textarea', className: 'field-full' },
      { key: 'discussion_attorneys', label: '谈案律师', type: 'text' },
      { key: 'quote', label: '报价', type: 'text' },
      { key: 'converted', label: '是否成交', type: 'text' }
    ],
    genericVisibility: { title: true, client: false, contact: false, amount: false, status: false }
  },
  finance: {
    label: '案件收款',
    fields: [
      { key: 'case_type', label: '案件类型', type: 'select', options: caseTypeOptions },
      { key: 'case_name', label: '案件名称', type: 'text' },
      { key: 'accept_date', label: '受理日期', type: 'date' },
      { key: 'main_attorney', label: '主办律师', type: 'text' },
      { key: 'amount_entries', label: '案件金额', type: 'amount_table', className: 'field-full' },
      { key: 'invoice_entries', label: '开票信息', type: 'invoice_table', className: 'field-full' },
      { key: 'account_book', label: '台账位置', type: 'text' },
      { key: 'collection_status', label: '收款情况', type: 'text' },
      { key: 'file_status', label: '归档情况', type: 'text' },
      { key: 'split_enabled', label: '是否分成', type: 'checkbox' },
      { key: 'split_entries', label: '分成情况', type: 'split_table', className: 'field-full', condition: (v) => Boolean(v.split_enabled) },
      { key: 'note', label: '补充说明', type: 'textarea', className: 'field-full' }
    ],
    genericVisibility: { title: false, client: false, contact: false, amount: false, status: false }
  },
  financial_flow: {
    label: '财务收支',
    fields: [
      { key: 'project_name', label: '合同/项目名称', type: 'text' },
      { key: 'flow_date', label: '日期', type: 'date' },
      { key: 'amount', label: '金额', type: 'text' },
      { key: 'flow_type', label: '收/支', type: 'select', options: [
        { value: '收', label: '收' },
        { value: '支', label: '支' }
      ] },
      { key: 'counterparty', label: '交易对手', type: 'text' },
      { key: 'invoice_entries', label: '开票信息', type: 'invoice_table', className: 'field-full' },
      { key: 'receipt_note', label: '收款/支出说明', type: 'textarea', className: 'field-full' },
      { key: 'note', label: '备注说明', type: 'textarea', className: 'field-full' }
    ],
    genericVisibility: { title: false, client: false, contact: false, amount: false, status: false }
  },
  reserve: {
    label: '备用金收支',
    fields: [
      { key: 'record_date', label: '时间', type: 'date' },
      { key: 'record_type', label: '类型', type: 'text' },
      { key: 'income', label: '收入(¥)', type: 'text' },
      { key: 'expense', label: '支出(¥)', type: 'text' },
      { key: 'receipt_note', label: '收款/支出说明', type: 'textarea', className: 'field-full' }
    ],
    genericVisibility: { title: false, client: false, contact: false, amount: false, status: false }
  }
};

function parseJSON(value) {
  if (!value) return {};
  try {
    return typeof value === 'string' ? JSON.parse(value) : value;
  } catch (error) {
    return {};
  }
}

function getFieldValues(existing = {}) {
  const values = { ...existing };
  dynamicFields.querySelectorAll('[name]').forEach((input) => {
    const inputValue = input.type === 'checkbox' ? input.checked : input.value;
    setValueByName(values, input.name, inputValue);
  });
  return values;
}

async function fetchCategories() {
  try {
    const response = await fetch('/api/categories');
    if (!response.ok) throw new Error('分类请求失败');
    categories = await response.json();
  } catch (error) {
    console.error('无法加载分类：', error);
    categories = [
      { key: 'ongoing', label: '在办案件' },
      { key: 'leads', label: '客户线索' },
      { key: 'finance', label: '案件收款' },
      { key: 'financial_flow', label: '财务收支' },
      { key: 'reserve', label: '备用金收支' }
    ];
  }
  renderCategories();
  renderFormFields();
}

function renderCategories() {
  categoryTabs.innerHTML = categories
    .map(
      (category) => `<button class="tab-button${category.key === activeCategory ? ' active' : ''}" data-key="${category.key}">${category.label}</button>`
    )
    .join('');

  document.querySelectorAll('.tab-button').forEach((button) => {
    button.addEventListener('click', () => {
      activeCategory = button.dataset.key;
      document.querySelectorAll('.tab-button').forEach((btn) => btn.classList.remove('active'));
      button.classList.add('active');
      renderFormFields();
      loadItems();
    });
  });
}

function setValueByName(values, name, value) {
  const match = name.match(/^([^\[]+)\[(\d+)\]\.(.+)$/);
  if (match) {
    const key = match[1];
    const index = Number(match[2]);
    const sub = match[3];
    if (!Array.isArray(values[key])) values[key] = [];
    if (!values[key][index]) values[key][index] = {};
    values[key][index][sub] = value;
  } else {
    values[name] = value;
  }
}

function createTableRow(fieldKey, index, row, columns) {
  return `
    <tr data-index="${index}">
      ${columns
        .map((col) => {
          const fieldValue = row[col.key] || '';
          return `<td><input type="${col.type || 'text'}" name="${fieldKey}[${index}].${col.key}" value="${fieldValue}" placeholder="${col.label}" /></td>`;
        })
        .join('')}
      <td><button type="button" class="table-remove-button" data-table="${fieldKey}" data-index="${index}">删除</button></td>
    </tr>
  `;
}

function createTableMarkup(field, rows, columns) {
  return `
    <div class="table-group ${field.className || ''}">
      <div class="table-top">
        <strong>${field.label}</strong>
        <button type="button" class="table-add-button" data-table="${field.key}">添加行</button>
      </div>
      <table class="entry-table" data-table="${field.key}">
        <thead>
          <tr>
            ${columns.map((col) => `<th>${col.label}</th>`).join('')}
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map((row, index) => createTableRow(field.key, index, row, columns)).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function createFieldMarkup(field, value = '') {
  const className = field.className ? `field-${field.className}` : '';
  if (field.type === 'select') {
    return `
      <label class="${className}">${field.label}
        <select name="${field.key}">
          ${field.options
            .map(
              (option) => `<option value="${option.value}" ${option.value === value ? 'selected' : ''}>${option.label}</option>`
            )
            .join('')}
        </select>
      </label>
    `;
  }

  if (field.type === 'textarea') {
    return `
      <label class="${className}">${field.label}
        <textarea name="${field.key}" placeholder="${field.label}">${value || ''}</textarea>
      </label>
    `;
  }

  if (field.type === 'checkbox') {
    return `
      <label class="${className}">
        <input type="checkbox" name="${field.key}" ${value ? 'checked' : ''} /> ${field.label}
      </label>
    `;
  }

  if (field.type === 'amount_table') {
    const rows = Array.isArray(value) && value.length ? value : [{ nature: '', date: '', amount: '' }];
    return createTableMarkup(field, rows, [
      { key: 'nature', label: '性质', type: 'text' },
      { key: 'date', label: '收款时间', type: 'date' },
      { key: 'amount', label: '收款金额', type: 'text' }
    ]);
  }

  if (field.type === 'invoice_table') {
    const rows = Array.isArray(value) && value.length ? value : [{ date: '', amount: '', number: '' }];
    return createTableMarkup(field, rows, [
      { key: 'date', label: '开票日期', type: 'date' },
      { key: 'amount', label: '开票金额', type: 'text' },
      { key: 'number', label: '发票号', type: 'text' }
    ]);
  }

  if (field.type === 'split_table') {
    const rows = Array.isArray(value) && value.length ? value : [{ person: '', reason: '', ratio: '', amount: '', self_amount: '' }];
    return createTableMarkup(field, rows, [
      { key: 'person', label: '分成人', type: 'text' },
      { key: 'reason', label: '分成原因', type: 'text' },
      { key: 'ratio', label: '分成比例', type: 'text' },
      { key: 'amount', label: '分成金额', type: 'text' },
      { key: 'self_amount', label: '本人应收金额', type: 'text' }
    ]);
  }

  if (field.type === 'work_log_table') {
    const rows = Array.isArray(value) && value.length ? value : [{ date: '', content: '', attorney: '' }];
    return createTableMarkup(field, rows, [
      { key: 'date', label: '时间', type: 'date' },
      { key: 'content', label: '内容', type: 'text' },
      { key: 'attorney', label: '承办人', type: 'text' }
    ]);
  }

  return `
    <label class="${className}">${field.label}
      <input type="${field.type || 'text'}" name="${field.key}" value="${value || ''}" placeholder="${field.label}" />
    </label>
  `;
}

function updateGenericFieldVisibility() {
  const def = categoryDefinitions[activeCategory];
  const visible = def?.genericVisibility || { title: true, client: true, contact: true, amount: true, status: true };
  document.getElementById('titleField').style.display = visible.title ? 'block' : 'none';
  document.getElementById('clientField').style.display = visible.client ? 'block' : 'none';
  document.getElementById('contactField').style.display = visible.contact ? 'block' : 'none';
  document.getElementById('amountField').style.display = visible.amount ? 'block' : 'none';
  document.getElementById('statusField').style.display = visible.status ? 'block' : 'none';
}

function renderFormFields(existing = {}) {
  const activeElement = document.activeElement;
  const activeName = activeElement?.name;
  const selectionStart = activeElement?.selectionStart;
  const selectionEnd = activeElement?.selectionEnd;

  const values = getFieldValues(existing);
  const categoryDef = categoryDefinitions[activeCategory] || categoryDefinitions.ongoing;
  dynamicFields.innerHTML = categoryDef.fields
    .filter((field) => !field.condition || field.condition(values))
    .map((field) => createFieldMarkup(field, values[field.key]))
    .join('');

  if (activeName) {
    const restored = dynamicFields.querySelector(`[name="${activeName}"]`);
    if (restored && typeof restored.focus === 'function') {
      restored.focus();
      if (typeof selectionStart === 'number' && typeof selectionEnd === 'number') {
        restored.setSelectionRange(selectionStart, selectionEnd);
      }
    }
  }

  updateGenericFieldVisibility();
  updateConditionState(values);
  formTitle.textContent = editingId ? `编辑 ${categoryDef.label} 记录` : `新增 ${categoryDef.label} 记录`;
}

function renderSummary(summary) {
  summaryGrid.innerHTML = `
    <div class="summary-card">
      <strong>在办案件</strong>
      <span>${summary.ongoingCount}</span>
    </div>
    <div class="summary-card">
      <strong>客户线索</strong>
      <span>${summary.leadsCount}</span>
    </div>
    <div class="summary-card">
      <strong>案件收款</strong>
      <span>${summary.financeCount}</span>
      <span style="font-size: 14px; color: #4260a7; margin-top: 8px; display: block;">总金额 ${summary.financeTotal.toLocaleString()}¥</span>
      <span style="font-size: 14px; color: #4260a7; display: block;">已收 ${summary.financeReceived.toLocaleString()}¥</span>
    </div>
    <div class="summary-card">
      <strong>财务收支</strong>
      <span>${summary.financialFlowCount}</span>
      <span style="font-size: 14px; color: #4260a7; margin-top: 8px; display: block;">收入 ${summary.flowIncome.toLocaleString()}¥</span>
      <span style="font-size: 14px; color: #4260a7; display: block;">支出 ${summary.flowExpense.toLocaleString()}¥</span>
    </div>
    <div class="summary-card">
      <strong>备用金收支</strong>
      <span>${summary.reserveCount} 条</span>
      <span style="font-size: 14px; color: #4260a7; margin-top: 8px; display: block;">余额 ${summary.reserveBalance.toLocaleString()}¥</span>
      <span style="font-size: 14px; color: #4260a7; display: block;">收入 ${summary.reserveIncome.toLocaleString()}¥ / 支出 ${summary.reserveExpense.toLocaleString()}¥</span>
    </div>
  `;
}

async function loadSummary() {
  const res = await fetch('/api/summary');
  const summary = await res.json();
  renderSummary(summary);
}

function formatMoney(value) {
  const amount = Number(value || 0);
  return Number.isNaN(amount) ? '-' : `${amount.toLocaleString()}¥`;
}

function getDisplayTitle(item, meta) {
  if (item.title) return item.title;
  if (activeCategory === 'reserve') {
    return `${meta.record_type || '备用金记录'} ${meta.record_date || ''}`.trim();
  }
  if (activeCategory === 'financial_flow') {
    return meta.project_name || meta.counterparty || '财务收支记录';
  }
  return meta.case_name || meta.source || meta.record_type || item.title || '未命名';
}

function renderList(items) {
  if (!items.length) {
    listPanel.innerHTML = '<p>当前分类暂无记录，请新增一条记录。</p>';
    return;
  }

  listPanel.innerHTML = `
    <div class="data-table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>主题</th>
            <th>关键字段</th>
            <th>金额 / 记录</th>
            <th>更新时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          ${items
          .map((item) => {
            const meta = parseJSON(item.meta);
            const title = item.title || getDisplayTitle(item, meta);
            const subtitle = activeCategory === 'financial_flow'
              ? [meta.flow_type, meta.counterparty].find(Boolean) || '—'
              : [meta.procedure_stage, meta.stage, meta.account_book, meta.record_type].find(Boolean) || '—';
            let amountText = '-';
            if (activeCategory === 'finance') {
              const entries = Array.isArray(meta.amount_entries) ? meta.amount_entries : [];
              amountText = `总计 ${formatMoney(entries.reduce((sum, entry) => sum + Number(entry.amount || 0), 0))}`;
            }
            if (activeCategory === 'reserve') {
              amountText = `收入 ${formatMoney(meta.income)} / 支出 ${formatMoney(meta.expense)}`;
            }
            if (activeCategory === 'financial_flow') {
              amountText = `${meta.flow_type || '—'} ${formatMoney(meta.amount)}`;
            }
            return `
              <tr>
                <td>${title}</td>
                <td>${subtitle}</td>
                <td>${amountText}</td>
                <td>${new Date(item.updated_at).toLocaleString()}</td>
                <td class="action-buttons">
                  <button class="view" data-id="${item.id}">查看</button>
                  <button class="edit" data-id="${item.id}">编辑</button>
                  <button class="delete" data-id="${item.id}">删除</button>
                </td>
              </tr>
            `;
          })
          .join('')}
      </tbody>
    </table>
  `;

  listPanel.querySelectorAll('button.view').forEach((button) => {
    button.addEventListener('click', () => showDetail(Number(button.dataset.id)));
  });
  listPanel.querySelectorAll('button.edit').forEach((button) => {
    button.addEventListener('click', () => startEdit(Number(button.dataset.id)));
  });
  listPanel.querySelectorAll('button.delete').forEach((button) => {
    button.addEventListener('click', () => deleteItem(Number(button.dataset.id)));
  });
}

function formatDetailRow(label, value) {
  return `
    <div class="detail-item">
      <strong>${label}</strong>
      <span>${value || '—'}</span>
    </div>
  `;
}

function renderDetail(item) {
  if (!item) {
    detailPanel.classList.add('hidden');
    return;
  }
  const meta = parseJSON(item.meta);
  const images = parseJSON(item.images) || [];
  const rows = [];
  const pushRow = (label, value) => rows.push(formatDetailRow(label, value));

  pushRow('主题', item.title || getDisplayTitle(item, meta));
  if (item.category !== 'reserve') {
    pushRow('客户 / 委托人', item.client || meta.client || meta.entrustor || item.contact);
    pushRow('联系方式', item.contact || meta.client_contact || meta.entrust_contact || meta.contact);
  }
  pushRow('更新时间', new Date(item.updated_at).toLocaleString());
  pushRow('备注说明', item.details);

  Object.entries(meta).forEach(([key, value]) => {
    if (!value) return;
    if (item.category === 'ongoing' && key === 'status') return;
    if (key === 'amount_entries' || key === 'invoice_entries' || key === 'split_entries') return;
    const label = key.replace(/_/g, ' ');
    pushRow(label, value);
  });

  if (Array.isArray(meta.amount_entries) && meta.amount_entries.length) {
    pushRow(
      '案件金额',
      meta.amount_entries
        .map((entry) => `${entry.nature || ''} | ${entry.date || ''} | ${formatMoney(entry.amount)}`)
        .join('\n')
    );
  }
  if (Array.isArray(meta.invoice_entries) && meta.invoice_entries.length) {
    pushRow(
      '开票信息',
      meta.invoice_entries
        .map((entry) => `${entry.date || ''} | ${formatMoney(entry.amount)} | ${entry.number || ''}`)
        .join('\n')
    );
  }
  if (Array.isArray(meta.split_entries) && meta.split_entries.length) {
    pushRow(
      '分成情况',
      meta.split_entries
        .map((entry) => `${entry.person || ''} | ${entry.reason || ''} | ${entry.ratio || ''} | ${formatMoney(entry.amount)} | ${formatMoney(entry.self_amount)}`)
        .join('\n')
    );
  }
  if (Array.isArray(meta.work_logs) && meta.work_logs.length) {
    pushRow(
      '工作记录',
      meta.work_logs
        .map((entry) => `${entry.date || ''} | ${entry.content || ''} | ${entry.attorney || ''}`)
        .join('\n')
    );
  }

  detailPanel.innerHTML = `
    <div class="detail-panel">
      <div class="detail-list">${rows.join('')}</div>
      ${images.length ? `<div class="image-preview">${images.map((src) => `<img src="${src}" alt="附件" />`).join('')}</div>` : ''}
    </div>
  `;
  detailPanel.classList.remove('hidden');
}

function getFormData() {
  const meta = getFieldValues();
  return {
    category: activeCategory,
    title: itemTitle.value.trim() || meta.case_name || meta.project_name || meta.source || meta.record_type || `记录-${new Date().toLocaleDateString()}`,
    details: itemDetails.value.trim(),
    meta,
    images: currentImages,
    amount: 0,
    received_amount: 0
  };
}

function readFiles(files) {
  return Promise.all(
    Array.from(files).map(
      (file) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        })
    )
  );
}

itemImages.addEventListener('change', async () => {
  if (!itemImages.files.length) return;
  currentImages = await readFiles(itemImages.files);
  imagePreview.innerHTML = currentImages.map((src) => `<img src="${src}" alt="附件预览" />`).join('');
});

dynamicFields.addEventListener('click', (event) => {
  const target = event.target;
  const tableKey = target.dataset.table;
  if (!tableKey) return;

  if (target.classList.contains('table-add-button')) {
    const table = dynamicFields.querySelector(`table[data-table="${tableKey}"]`);
    const tbody = table?.querySelector('tbody');
    if (!tbody) return;
    const index = tbody.children.length;
    const field = categoryDefinitions[activeCategory].fields.find((f) => f.key === tableKey);
    if (!field) return;
    const row = {};
    const columns =
      field.type === 'amount_table'
        ? [
            { key: 'nature', label: '性质', type: 'text' },
            { key: 'date', label: '收款时间', type: 'date' },
            { key: 'amount', label: '收款金额', type: 'number' }
          ]
        : field.type === 'invoice_table'
        ? [
            { key: 'date', label: '开票日期', type: 'date' },
            { key: 'amount', label: '开票金额', type: 'number' },
            { key: 'number', label: '发票号', type: 'text' }
          ]
        : field.type === 'work_log_table'
        ? [
            { key: 'date', label: '时间', type: 'date' },
            { key: 'content', label: '内容', type: 'text' },
            { key: 'attorney', label: '承办人', type: 'text' }
          ]
        : [
            { key: 'person', label: '分成人', type: 'text' },
            { key: 'reason', label: '分成原因', type: 'text' },
            { key: 'ratio', label: '分成比例', type: 'text' },
            { key: 'amount', label: '分成金额', type: 'number' },
            { key: 'self_amount', label: '本人应收金额', type: 'number' }
          ];
    tbody.insertAdjacentHTML('beforeend', createTableRow(tableKey, index, row, columns));
    return;
  }

  if (target.classList.contains('table-remove-button')) {
    const row = target.closest('tr');
    const table = dynamicFields.querySelector(`table[data-table="${tableKey}"]`);
    if (!row || !table) return;
    row.remove();
    Array.from(table.querySelectorAll('tbody tr')).forEach((tr, index) => {
      tr.dataset.index = index;
      tr.querySelectorAll('[name]').forEach((input) => {
        input.name = input.name.replace(/\[[0-9]+\]/, `[${index}]`);
      });
      const removeBtn = tr.querySelector('.table-remove-button');
      if (removeBtn) removeBtn.dataset.index = index;
    });
  }
});

itemForm.addEventListener('input', (event) => {
  if (shouldRerenderField(event.target)) {
    renderFormFields(getFieldValues());
  }
});

itemForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const payload = getFormData();

  if (!payload.title) {
    alert('请填写记录名称');
    return;
  }

  if (editingId) {
    await fetch(`/api/items/${editingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } else {
    await fetch('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }

  resetForm();
  closeForm();
  loadItems();
});

resetButton.addEventListener('click', (event) => {
  event.preventDefault();
  resetForm();
});

openFormButton.addEventListener('click', () => {
  resetForm();
  openForm();
});

closeFormButton.addEventListener('click', closeForm);

floatingForm.addEventListener('click', (event) => {
  if (event.target === floatingForm) closeForm();
});

function openForm() {
  floatingForm.classList.remove('hidden');
}

function closeForm() {
  floatingForm.classList.add('hidden');
}

function resetForm() {
  editingId = null;
  currentImages = [];
  itemDetails.value = '';
  itemImages.value = '';
  renderFormFields();
  imagePreview.innerHTML = '';
}

async function startEdit(id) {
  const res = await fetch(`/api/items/${id}`);
  const item = await res.json();
  if (!item) return;
  editingId = item.id;
  activeCategory = item.category;
  document.querySelectorAll('.tab-button').forEach((button) => {
    button.classList.toggle('active', button.dataset.key === activeCategory);
  });
  const meta = parseJSON(item.meta);
  itemDetails.value = item.details || '';
  currentImages = parseJSON(item.images) || [];
  renderFormFields(meta);
  imagePreview.innerHTML = currentImages.map((src) => `<img src="${src}" alt="附件预览" />`).join('');
  openForm();
}

async function deleteItem(id) {
  if (!confirm('确定要删除这条记录吗？')) return;
  await fetch(`/api/items/${id}`, { method: 'DELETE' });
  loadItems();
}

function showDetail(id) {
  const item = currentItems.find((entry) => entry.id === id);
  if (!item) return;
  renderDetail(item);
}

async function loadItems() {
  const res = await fetch(`/api/items?category=${activeCategory}`);
  currentItems = await res.json();
  renderList(currentItems);
  detailPanel.classList.add('hidden');
  await loadSummary();
}

fetchCategories().then(() => {
  renderFormFields();
  loadItems();
});
