/**
 * ONYX MUN Admin Dashboard
 */
(function () {
  const SUPABASE_URL = 'https://pmqbfmgjazlbtdtnlvez.supabase.co';
  const SUPABASE_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtcWJmbWdqYXpsYnRkdG5sdmV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2NTQ5MzgsImV4cCI6MjA5MjIzMDkzOH0.XjmK1DhqyJJaTcBXso0IdkFrcK4C2f0MqxexDqzdrwQ';
  const VALID_PASSWORDS = ['ruthwiknadevudu', 'onyxmunhyd'];
  const SESSION_KEY = 'onyx_admin_auth';

  const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const state = {
    eb: [],
    delegate: [],
    priority: [],
    oc: [],
    currentView: 'overview',
    selected: { eb: new Set(), delegate: new Set(), priority: new Set(), oc: new Set() },
    lastSync: null,
  };

  const VIEWS = {
    overview: { title: 'Overview', subtitle: 'Analytics & insights across all applications' },
    eb: { title: 'Executive Board', subtitle: 'EB application pipeline' },
    delegate: { title: 'Delegates', subtitle: 'Delegate applications & allocations' },
    priority: { title: 'Priority Round', subtitle: 'Priority round registrations & payments' },
    oc: { title: 'Organising Committee', subtitle: 'OC applications' },
  };

  const TABLE_MAP = {
    eb: 'eb_applications',
    delegate: 'delegate_applications',
    priority: 'priority_applications',
    oc: 'oc_applications',
  };

  const STATUS_LABELS = {
    pending: 'Pending',
    under_review: 'Under Review',
    accepted: 'Accepted',
    rejected: 'Rejected',
    withdrawn: 'Withdrawn',
  };

  /** When applications opened for ONYX 2026 (cycle start for charts) */
  const APPLICATIONS_OPEN_DATE = new Date('2026-03-01T00:00:00+05:30');
  /** Conference dates — shown in chart subtitle */
  const CONFERENCE_START = new Date('2026-06-12T00:00:00+05:30');

  // --- Utilities ---
  function $(id) {
    return document.getElementById(id);
  }

  function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function toast(message, type = 'success') {
    const container = $('toastContainer');
    if (!container) return;
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = message;
    container.appendChild(el);
    setTimeout(() => el.remove(), 3200);
  }

  function formatStatus(s) {
    return STATUS_LABELS[s] || s || 'Pending';
  }

  function formatDate(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function formatPosition(pos) {
    if (!pos) return 'N/A';
    return pos.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  function getApps(type) {
    return state[type] || [];
  }

  function allApps() {
    return [...state.eb, ...state.delegate, ...state.priority, ...state.oc];
  }

  function setSyncStatus() {
    const el = $('syncStatus');
    if (!el) return;
    if (!state.lastSync) {
      el.textContent = 'Not synced';
      return;
    }
    el.textContent = `Updated ${state.lastSync.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
  }

  // --- Auth ---
  function showDashboard() {
    $('loginScreen').style.display = 'none';
    $('adminApp').classList.add('active');
    switchView('overview');
    loadApplications(true);
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    $('adminApp').classList.remove('active');
    $('loginScreen').style.display = 'flex';
    $('password').value = '';
    $('errorMsg').classList.remove('visible');
    closeSidebar();
  }

  // --- Navigation ---
  function switchView(view) {
    state.currentView = view;
    document.querySelectorAll('.nav-item[data-view]').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.view === view);
    });
    document.querySelectorAll('.view-panel').forEach((panel) => {
      panel.classList.toggle('active', panel.id === `view-${view}`);
    });
    const meta = VIEWS[view];
    $('pageTitle').textContent = meta.title;
    $('pageSubtitle').textContent = meta.subtitle;
    const exportBtn = $('topbarExport');
    if (exportBtn) {
      exportBtn.style.display = view === 'overview' ? 'none' : 'inline-flex';
      exportBtn.dataset.exportType = view;
    }
    closeSidebar();
    if (view === 'overview') renderOverview();
    else filterApplications(view);
  }

  function closeSidebar() {
    $('sidebar')?.classList.remove('open');
    $('sidebarOverlay')?.classList.remove('visible');
  }

  function updateNavBadges() {
    ['eb', 'delegate', 'priority', 'oc'].forEach((t) => {
      const badge = $(`badge-${t}`);
      if (badge) badge.textContent = getApps(t).length;
    });
  }

  // --- Data load ---
  async function loadApplications(silent = false) {
    const grids = ['eb', 'delegate', 'priority', 'oc'];
    grids.forEach((t) => {
      const grid = $(`${t}ApplicationsGrid`);
      if (grid) grid.innerHTML = '<div class="no-data"><p>Loading…</p></div>';
    });

    try {
      const [ebRes, delRes, priRes, ocRes] = await Promise.all([
        supabaseClient.from('eb_applications').select('*').order('submitted_at', { ascending: false }),
        supabaseClient.from('delegate_applications').select('*').order('submitted_at', { ascending: false }),
        supabaseClient.from('priority_applications').select('*').order('submitted_at', { ascending: false }),
        supabaseClient.from('oc_applications').select('*').order('submitted_at', { ascending: false }),
      ]);

      if (ebRes.error) throw ebRes.error;
      if (delRes.error) throw delRes.error;
      if (priRes.error) throw priRes.error;

      state.eb = ebRes.data || [];
      state.delegate = delRes.data || [];
      state.priority = priRes.data || [];
      state.oc = ocRes.error ? [] : ocRes.data || [];

      state.lastSync = new Date();
      setSyncStatus();
      updateNavBadges();
      updateSectionStats();
      renderOverview();

      renderEBApplications(state.eb);
      renderDelegateApplications(state.delegate);
      renderPriorityApplications(state.priority);
      renderOCApplications(state.oc);

      if (ocRes.error) {
        const ocGrid = $('ocApplicationsGrid');
        if (ocGrid) {
          ocGrid.innerHTML =
            '<div class="no-data"><p>OC table unavailable.</p><p style="font-size:0.8rem;margin-top:8px;">Run Supabase migration for oc_applications.</p></div>';
        }
      }

      if (!silent) toast('Data refreshed', 'success');
    } catch (err) {
      console.error(err);
      const msg = `<div class="no-data"><p>Error loading data</p><p style="font-size:0.8rem;margin-top:8px;">${escapeHtml(err.message)}</p></div>`;
      grids.forEach((t) => {
        const g = $(`${t}ApplicationsGrid`);
        if (g) g.innerHTML = msg;
      });
      toast('Failed to load applications', 'error');
    }
  }

  function countTodayWeek(data) {
    const now = new Date();
    const today = data.filter((a) => new Date(a.submitted_at || a.created_at).toDateString() === now.toDateString()).length;
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const week = data.filter((a) => new Date(a.submitted_at || a.created_at) >= weekAgo).length;
    return { today, week };
  }

  function updateSectionStats() {
    const sections = [
      { type: 'eb', data: state.eb },
      { type: 'delegate', data: state.delegate },
      { type: 'priority', data: state.priority },
      { type: 'oc', data: state.oc },
    ];
    sections.forEach(({ type, data }) => {
      const { today, week } = countTodayWeek(data);
      const totalEl = $(`${type}TotalCount`);
      const todayEl = $(`${type}TodayCount`);
      const weekEl = $(`${type}WeekCount`);
      if (totalEl) totalEl.textContent = data.length;
      if (todayEl) todayEl.textContent = today;
      if (weekEl) weekEl.textContent = week;
    });

    const all = allApps();
    const { today, week } = countTodayWeek(all);
    if ($('overviewTotal')) $('overviewTotal').textContent = all.length;
    if ($('overviewToday')) $('overviewToday').textContent = today;
    if ($('overviewWeek')) $('overviewWeek').textContent = week;
    if ($('overviewBest')) {
      $('overviewBest').textContent = all.filter((a) => a.is_best).length;
    }
    const accepted = all.filter((a) => a.status === 'accepted').length;
    if ($('overviewAccepted')) $('overviewAccepted').textContent = accepted;
    const pending = all.filter((a) => !a.status || a.status === 'pending').length;
    if ($('overviewPending')) $('overviewPending').textContent = pending;
  }

  // --- Analytics ---
  function renderOverview() {
    updateSectionStats();
    renderStatusChart();
    renderTimelineChart();
    renderTypeBreakdown();
    renderRecentActivity();
    renderEBPositionsChart();
    renderCommitteePrefsChart();
  }

  function renderStatusChart() {
    const el = $('chartStatus');
    if (!el) return;
    const counts = { pending: 0, under_review: 0, accepted: 0, rejected: 0, withdrawn: 0 };
    allApps().forEach((a) => {
      const s = a.status || 'pending';
      if (counts[s] !== undefined) counts[s]++;
      else counts.pending++;
    });
    const max = Math.max(...Object.values(counts), 1);
    el.innerHTML = Object.entries(counts)
      .map(
        ([key, val]) => `
      <div class="bar-row">
        <span class="bar-label">${formatStatus(key)}</span>
        <div class="bar-track"><div class="bar-fill status-${key}" style="width:${(val / max) * 100}%"></div></div>
        <span class="bar-count">${val}</span>
      </div>`
      )
      .join('');
  }

  function startOfDay(d) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  }

  function getApplicationCycleStart() {
    const apps = allApps();
    let earliest = startOfDay(APPLICATIONS_OPEN_DATE);
    if (apps.length) {
      apps.forEach((a) => {
        const d = startOfDay(new Date(a.submitted_at || a.created_at));
        if (d < earliest) earliest = d;
      });
    }
    return earliest;
  }

  function buildDailySeries() {
    const start = getApplicationCycleStart();
    const end = startOfDay(new Date());
    const byDay = new Map();

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      byDay.set(startOfDay(d).toISOString().slice(0, 10), 0);
    }

    allApps().forEach((a) => {
      const key = startOfDay(new Date(a.submitted_at || a.created_at)).toISOString().slice(0, 10);
      if (byDay.has(key)) byDay.set(key, byDay.get(key) + 1);
    });

    return Array.from(byDay.entries()).map(([key, count]) => ({
      date: new Date(key + 'T12:00:00'),
      count,
    }));
  }

  function renderTimelineChart() {
    const el = $('chartTimeline');
    const metaEl = $('chartTimelineMeta');
    const descEl = $('chartTimelineDesc');
    if (!el) return;

    const series = buildDailySeries();
    const start = series[0]?.date;
    const total = series.reduce((s, p) => s + p.count, 0);
    const peak = series.reduce((best, p) => (p.count > best.count ? p : best), { count: 0, date: null });
    const daySpan = series.length || 1;
    const avg = (total / daySpan).toFixed(1);

    if (descEl && start) {
      const openStr = start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      const confStr = CONFERENCE_START.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      descEl.textContent = `Daily volume from ${openStr} · Conference ${confStr}`;
    }

    if (metaEl) {
      metaEl.innerHTML = `
        <div class="line-chart-stat"><strong>${total}</strong><span>Total since open</span></div>
        <div class="line-chart-stat"><strong>${peak.count}</strong><span>Peak day</span></div>
        <div class="line-chart-stat"><strong>${avg}</strong><span>Avg / day</span></div>`;
    }

    if (!series.length || total === 0) {
      el.innerHTML = '<div class="line-chart-empty">No submissions yet — line will appear when applications arrive</div>';
      return;
    }

    const W = 880;
    const H = 220;
    const pad = { top: 28, right: 20, bottom: 36, left: 44 };
    const plotW = W - pad.left - pad.right;
    const plotH = H - pad.top - pad.bottom;
    const maxY = Math.max(...series.map((p) => p.count), 1);
    const yTicks = Math.min(maxY, 5);
    const yStep = Math.ceil(maxY / yTicks) || 1;
    const yMax = yStep * yTicks;

    const points = series.map((p, i) => {
      const x = pad.left + (series.length === 1 ? plotW / 2 : (i / (series.length - 1)) * plotW);
      const y = pad.top + plotH - (p.count / yMax) * plotH;
      return { x, y, ...p };
    });

    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${(pad.top + plotH).toFixed(1)} L ${points[0].x.toFixed(1)} ${(pad.top + plotH).toFixed(1)} Z`;

    const gridLines = [];
    for (let i = 0; i <= yTicks; i++) {
      const y = pad.top + plotH - (i / yTicks) * plotH;
      gridLines.push(`<line x1="${pad.left}" y1="${y}" x2="${W - pad.right}" y2="${y}"/>`);
    }

    const yLabels = [];
    for (let i = 0; i <= yTicks; i++) {
      const val = Math.round((i / yTicks) * yMax);
      const y = pad.top + plotH - (i / yTicks) * plotH;
      yLabels.push(`<text x="${pad.left - 8}" y="${y + 4}" text-anchor="end">${val}</text>`);
    }

    const labelEvery = series.length <= 14 ? 1 : series.length <= 45 ? 7 : Math.ceil(series.length / 10);
    const xLabels = points
      .filter((_, i) => i === 0 || i === points.length - 1 || i % labelEvery === 0)
      .map((p) => {
        const label = p.date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        return `<text x="${p.x}" y="${H - 10}" text-anchor="middle">${label}</text>`;
      })
      .join('');

    const dots = points
      .map(
        (p, i) =>
          `<circle class="line-chart-dot" data-count="${p.count}" data-index="${i}" cx="${p.x}" cy="${p.y}" r="${p.count > 0 ? 4 : 2.5}"/>`
      )
      .join('');

    el.innerHTML = `
      <div class="line-chart-tooltip" id="lineChartTooltip"></div>
      <svg class="line-chart-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Applications over time line chart">
        <defs>
          <linearGradient id="lineChartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="rgba(212, 175, 55, 0.35)"/>
            <stop offset="100%" stop-color="rgba(212, 175, 55, 0)"/>
          </linearGradient>
          <linearGradient id="lineChartStroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#D4AF37"/>
            <stop offset="50%" stop-color="#E5C354"/>
            <stop offset="100%" stop-color="#D4AF37"/>
          </linearGradient>
        </defs>
        <g class="line-chart-grid">${gridLines.join('')}</g>
        <g class="line-chart-axis">${yLabels.join('')}${xLabels}</g>
        <path class="line-chart-area" d="${areaPath}"/>
        <path class="line-chart-line" d="${linePath}"/>
        <g class="line-chart-points">${dots}</g>
      </svg>
      <div class="line-chart-legend"><i></i> Daily submissions (all pipelines)</div>`;

    const tooltip = $('lineChartTooltip');
    const svg = el.querySelector('svg');
    if (!tooltip || !svg) return;

    function showTip(dot) {
      const i = Number(dot.dataset.index);
      const p = points[i];
      if (!p) return;
      const rect = svg.getBoundingClientRect();
      const wrapRect = el.getBoundingClientRect();
      const scaleX = rect.width / W;
      const scaleY = rect.height / H;
      const cx = rect.left - wrapRect.left + p.x * scaleX;
      const cy = rect.top - wrapRect.top + p.y * scaleY;
      const dateStr = p.date.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      tooltip.innerHTML = `<strong>${p.count} application${p.count === 1 ? '' : 's'}</strong><span>${dateStr}</span>`;
      tooltip.style.left = `${cx}px`;
      tooltip.style.top = `${cy}px`;
      tooltip.classList.add('visible');
      el.querySelectorAll('.line-chart-dot').forEach((d) => d.classList.remove('is-active'));
      dot.classList.add('is-active');
    }

    function hideTip() {
      tooltip.classList.remove('visible');
      el.querySelectorAll('.line-chart-dot').forEach((d) => d.classList.remove('is-active'));
    }

    el.querySelectorAll('.line-chart-dot').forEach((dot) => {
      dot.addEventListener('mouseenter', () => showTip(dot));
      dot.addEventListener('focus', () => showTip(dot));
      dot.addEventListener('mouseleave', hideTip);
      dot.addEventListener('blur', hideTip);
    });

    state._timelinePoints = points;
  }

  function renderTypeBreakdown() {
    const el = $('chartTypes');
    if (!el) return;
    const types = [
      { label: 'Executive Board', count: state.eb.length },
      { label: 'Delegates', count: state.delegate.length },
      { label: 'Priority Round', count: state.priority.length },
      { label: 'Organising Committee', count: state.oc.length },
    ];
    const max = Math.max(...types.map((t) => t.count), 1);
    el.innerHTML = types
      .map(
        (t) => `
      <div class="bar-row">
        <span class="bar-label">${t.label}</span>
        <div class="bar-track"><div class="bar-fill" style="width:${(t.count / max) * 100}%"></div></div>
        <span class="bar-count">${t.count}</span>
      </div>`
      )
      .join('');
  }

  function renderEBPositionsChart() {
    const el = $('chartEBPositions');
    if (!el) return;
    const map = {};
    state.eb.forEach((a) => {
      const p = formatPosition(a.position) || 'Unknown';
      map[p] = (map[p] || 0) + 1;
    });
    const entries = Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const max = Math.max(...entries.map((e) => e[1]), 1);
    el.innerHTML =
      entries.length === 0
        ? '<p class="chart-desc">No EB data yet</p>'
        : entries
            .map(
              ([label, val]) => `
        <div class="bar-row">
          <span class="bar-label">${escapeHtml(label)}</span>
          <div class="bar-track"><div class="bar-fill" style="width:${(val / max) * 100}%"></div></div>
          <span class="bar-count">${val}</span>
        </div>`
            )
            .join('');
  }

  function renderCommitteePrefsChart() {
    const el = $('chartCommittees');
    if (!el) return;
    const map = {};
    [...state.delegate, ...state.priority].forEach((a) => {
      const prefs = [
        a.preference_1,
        a.pref1_committee,
        a.preference_2,
        a.pref2_committee,
        a.preference_3,
        a.pref3_committee,
      ].filter(Boolean);
      prefs.forEach((p) => {
        const key = String(p).toUpperCase();
        map[key] = (map[key] || 0) + 1;
      });
    });
    const entries = Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 10);
    const max = Math.max(...entries.map((e) => e[1]), 1);
    el.innerHTML =
      entries.length === 0
        ? '<p class="chart-desc">No preference data yet</p>'
        : entries
            .map(
              ([label, val]) => `
        <div class="bar-row">
          <span class="bar-label">${escapeHtml(label)}</span>
          <div class="bar-track"><div class="bar-fill" style="width:${(val / max) * 100}%"></div></div>
          <span class="bar-count">${val}</span>
        </div>`
            )
            .join('');
  }

  function renderRecentActivity() {
    const el = $('recentActivity');
    if (!el) return;
    const recent = allApps()
      .sort((a, b) => new Date(b.submitted_at || b.created_at) - new Date(a.submitted_at || a.created_at))
      .slice(0, 8);
    if (!recent.length) {
      el.innerHTML = '<li>No applications yet</li>';
      return;
    }
    el.innerHTML = recent
      .map((a) => {
        const type = a.position
          ? 'EB'
          : a.pref1_committee
            ? 'Priority'
            : a.preference_1
              ? 'Delegate'
              : 'OC';
        return `<li>
          <span class="recent-name">${escapeHtml(a.full_name || 'Unknown')}</span>
          <span class="recent-meta">${type} · ${formatDate(a.submitted_at || a.created_at)}</span>
        </li>`;
      })
      .join('');
  }

  // --- Filter & render ---
  function filterApplications(type) {
    const search = ($(`${type}SearchInput`)?.value || '').toLowerCase();
    const statusFilter = $(`${type}StatusFilter`)?.value || '';
    const bestFilter = $(`${type}BestFilter`)?.value || '';

    let data = getApps(type).filter((app) => {
      const matchSearch =
        !search ||
        (app.full_name && app.full_name.toLowerCase().includes(search)) ||
        (app.email && app.email.toLowerCase().includes(search));
      const matchStatus = !statusFilter || (app.status || 'pending') === statusFilter;
      const matchBest = bestFilter !== 'best' || app.is_best;
      return matchSearch && matchStatus && matchBest;
    });

    if (type === 'eb') renderEBApplications(data);
    else if (type === 'delegate') renderDelegateApplications(data);
    else if (type === 'priority') renderPriorityApplications(data);
    else renderOCApplications(data);
  }

  function cardShell(type, app, innerHtml) {
    const isBest = app.is_best;
    return `
      <article class="application-card ${isBest ? 'is-best' : ''}" data-id="${escapeHtml(app.id)}">
        <div class="card-select">
          <input type="checkbox" class="bulk-checkbox" data-bulk-type="${type}" data-bulk-id="${escapeHtml(app.id)}" ${state.selected[type].has(app.id) ? 'checked' : ''}>
          <span style="font-size:0.72rem;color:var(--admin-muted);text-transform:uppercase;letter-spacing:0.06em">Select</span>
        </div>
        ${innerHtml}
      </article>`;
  }

  function actionButtons(type, app) {
    const alloc =
      type === 'delegate' || type === 'priority'
        ? { committee: app.allocated_committee || '', portfolio: app.allocated_portfolio || '' }
        : null;
    const allocAttr = alloc ? ` data-alloc-committee="${escapeHtml(alloc.committee)}" data-alloc-portfolio="${escapeHtml(alloc.portfolio)}"` : '';
    return `
      <div class="action-buttons">
        <button type="button" class="action-btn email" data-action="email" data-email-type="${type}" data-template="under_review" data-id="${escapeHtml(app.id)}" data-name="${escapeHtml(app.full_name)}" data-email="${escapeHtml(app.email)}"${allocAttr}>Review Email</button>
        <button type="button" class="action-btn email accept" data-action="email" data-email-type="${type}" data-template="accept" data-id="${escapeHtml(app.id)}" data-name="${escapeHtml(app.full_name)}" data-email="${escapeHtml(app.email)}"${allocAttr}>Accept Email</button>
        <button type="button" class="action-btn email reject" data-action="email" data-email-type="${type}" data-template="reject" data-id="${escapeHtml(app.id)}" data-name="${escapeHtml(app.full_name)}" data-email="${escapeHtml(app.email)}"${allocAttr}>Reject Email</button>
        <button type="button" class="action-btn whatsapp" data-action="whatsapp" data-phone="${escapeHtml(app.phone)}" data-name="${escapeHtml(app.full_name)}">WhatsApp</button>
        <button type="button" class="action-btn delete" data-action="delete" data-type="${type}" data-id="${escapeHtml(app.id)}" data-name="${escapeHtml(app.full_name)}">Delete</button>
      </div>`;
  }

  function statusBlock(type, app) {
    const st = app.status || 'pending';
    return `
      <div class="card-controls">
        <span class="status-badge ${st}">${formatStatus(st)}</span>
        <select class="status-dropdown" data-action="status" data-type="${type}" data-id="${escapeHtml(app.id)}">
          ${['pending', 'under_review', 'accepted', 'rejected', 'withdrawn']
            .map((s) => `<option value="${s}" ${st === s ? 'selected' : ''}>${formatStatus(s)}</option>`)
            .join('')}
        </select>
        <span class="app-date">${formatDate(app.submitted_at || app.created_at)}</span>
      </div>`;
  }

  function notesBlock(type, app) {
    return `
      <div class="notes-field">
        <label>Admin Notes</label>
        <textarea data-action="notes" data-type="${type}" data-id="${escapeHtml(app.id)}" placeholder="Private notes…">${escapeHtml(app.admin_notes || '')}</textarea>
      </div>`;
  }

  function bestBlock(type, app) {
    return `
      <label class="best-toggle">
        <input type="checkbox" data-action="best" data-type="${type}" data-id="${escapeHtml(app.id)}" data-current="${app.is_best ? '1' : '0'}" ${app.is_best ? 'checked' : ''}>
        Mark as Best of the Best
      </label>`;
  }

  function renderEBApplications(data) {
    const grid = $('ebApplicationsGrid');
    if (!grid) return;
    if (!data?.length) {
      grid.innerHTML = '<div class="no-data"><p>No EB applications found</p></div>';
      return;
    }
    grid.innerHTML = data
      .map((app) => {
        const inner = `
          <div class="card-top">
            <div>
              <h3 class="applicant-name">${escapeHtml(app.full_name || 'N/A')}${app.is_best ? '<span class="best-badge">★ Best</span>' : ''}</h3>
              <p class="applicant-role">${escapeHtml(formatPosition(app.position))}</p>
            </div>
          </div>
          ${statusBlock('eb', app)}
          <div class="detail-grid">
            <div class="detail-group"><span>Email</span><span>${escapeHtml(app.email)}</span></div>
            <div class="detail-group"><span>Phone</span><span>${escapeHtml(app.phone)}</span></div>
            <div class="detail-group"><span>Institution</span><span>${escapeHtml(app.institution)}</span></div>
            <div class="detail-group full"><span>MUN Experience</span><span class="detail-long">${escapeHtml(app.mun_experience)}</span></div>
            <div class="detail-group full"><span>Leadership</span><span class="detail-long">${escapeHtml(app.leadership_experience)}</span></div>
            <div class="detail-group full"><span>Motivation</span><span class="detail-long">${escapeHtml(app.motivation)}</span></div>
            ${app.additional_info ? `<div class="detail-group full"><span>Additional</span><span class="detail-long">${escapeHtml(app.additional_info)}</span></div>` : ''}
            <div class="detail-group"><span>Heard From</span><span>${escapeHtml(app.referral_source)}</span></div>
            <div class="detail-group full"><span>Queries</span><span class="detail-long">${escapeHtml(app.queries_feedback || 'None')}</span></div>
          </div>
          ${notesBlock('eb', app)}
          ${bestBlock('eb', app)}
          ${actionButtons('eb', app)}`;
        return cardShell('eb', app, inner);
      })
      .join('');
    updateBulkBar('eb');
  }

  function renderDelegateApplications(data) {
    const grid = $('delegateApplicationsGrid');
    if (!grid) return;
    if (!data?.length) {
      grid.innerHTML = '<div class="no-data"><p>No delegate applications found</p></div>';
      return;
    }
    grid.innerHTML = data
      .map((app) => {
        const inner = `
          <div class="card-top">
            <div>
              <h3 class="applicant-name">${escapeHtml(app.full_name || 'N/A')}${app.is_best ? '<span class="best-badge">★ Best</span>' : ''}</h3>
              <p class="applicant-role">${escapeHtml(app.preference_1 || app.preferred_committee || 'N/A')}</p>
            </div>
          </div>
          ${statusBlock('delegate', app)}
          <div class="detail-grid">
            <div class="detail-group"><span>Email</span><span>${escapeHtml(app.email)}</span></div>
            <div class="detail-group"><span>Phone</span><span>${escapeHtml(app.phone)}</span></div>
            <div class="detail-group"><span>Institution</span><span>${escapeHtml(app.institution)}</span></div>
            <div class="detail-group full"><span>Preferences</span><span>1. ${escapeHtml(app.preference_1)}<br>2. ${escapeHtml(app.preference_2)}<br>3. ${escapeHtml(app.preference_3)}</span></div>
            <div class="detail-group"><span>Experience</span><span>${escapeHtml(app.mun_experience)}</span></div>
            <div class="detail-group full"><span>Previous MUNs</span><span class="detail-long">${escapeHtml(app.previous_muns || app.previous_experience)}</span></div>
            <div class="detail-group full"><span>Motivation</span><span class="detail-long">${escapeHtml(app.motivation)}</span></div>
            <div class="detail-group full"><span>Queries</span><span class="detail-long">${escapeHtml(app.queries_feedback || 'None')}</span></div>
          </div>
          <div class="allocation-section">
            <label>Portfolio Allocation</label>
            <input type="text" class="allocation-input" id="alloc-committee-${escapeHtml(app.id)}" placeholder="Committee" value="${escapeHtml(app.allocated_committee || '')}">
            <input type="text" class="allocation-input" id="alloc-portfolio-${escapeHtml(app.id)}" placeholder="Portfolio" value="${escapeHtml(app.allocated_portfolio || '')}">
            <button type="button" class="action-btn save" data-action="allocation" data-type="delegate" data-id="${escapeHtml(app.id)}">Save Allocation</button>
          </div>
          ${notesBlock('delegate', app)}
          ${bestBlock('delegate', app)}
          ${actionButtons('delegate', app)}`;
        return cardShell('delegate', app, inner);
      })
      .join('');
    updateBulkBar('delegate');
  }

  function renderPriorityApplications(data) {
    const grid = $('priorityApplicationsGrid');
    if (!grid) return;
    if (!data?.length) {
      grid.innerHTML = '<div class="no-data"><p>No priority applications found</p></div>';
      return;
    }
    grid.innerHTML = data
      .map((app) => {
        const inner = `
          <div class="card-top">
            <div>
              <h3 class="applicant-name">${escapeHtml(app.full_name || 'N/A')}${app.is_best ? '<span class="best-badge">★ Best</span>' : ''}</h3>
              <p class="applicant-role">Priority Round</p>
            </div>
          </div>
          ${statusBlock('priority', app)}
          <div class="detail-grid">
            <div class="detail-group"><span>Email</span><span>${escapeHtml(app.email)}</span></div>
            <div class="detail-group"><span>Phone</span><span>${escapeHtml(app.phone)}</span></div>
            <div class="detail-group"><span>Institution</span><span>${escapeHtml(app.institution)}</span></div>
            <div class="detail-group full"><span>Preferences</span><span>
              1. ${escapeHtml((app.pref1_committee || '').toUpperCase())} — ${escapeHtml(app.pref1_portfolio)}<br>
              2. ${escapeHtml((app.pref2_committee || '').toUpperCase())} — ${escapeHtml(app.pref2_portfolio)}<br>
              3. ${escapeHtml((app.pref3_committee || '').toUpperCase())} — ${escapeHtml(app.pref3_portfolio)}
            </span></div>
            <div class="detail-group"><span>Experience</span><span>${escapeHtml(app.experience_level)}</span></div>
            <div class="detail-group full highlight-box"><span>UPI Transaction ID</span><span class="mono">${escapeHtml(app.transaction_id || 'NOT PROVIDED')}</span></div>
            <div class="detail-group full"><span>Queries</span><span class="detail-long">${escapeHtml(app.queries_feedback || 'None')}</span></div>
          </div>
          <div class="allocation-section">
            <label>Portfolio Allocation</label>
            <input type="text" class="allocation-input" id="alloc-committee-${escapeHtml(app.id)}" placeholder="Committee" value="${escapeHtml(app.allocated_committee || '')}">
            <input type="text" class="allocation-input" id="alloc-portfolio-${escapeHtml(app.id)}" placeholder="Portfolio" value="${escapeHtml(app.allocated_portfolio || '')}">
            <button type="button" class="action-btn save" data-action="allocation" data-type="priority" data-id="${escapeHtml(app.id)}">Save Allocation</button>
          </div>
          ${notesBlock('priority', app)}
          ${bestBlock('priority', app)}
          ${actionButtons('priority', app)}`;
        return cardShell('priority', app, inner);
      })
      .join('');
    updateBulkBar('priority');
  }

  function renderOCApplications(data) {
    const grid = $('ocApplicationsGrid');
    if (!grid) return;
    if (!data?.length) {
      grid.innerHTML = '<div class="no-data"><p>No OC applications found</p></div>';
      return;
    }
    grid.innerHTML = data
      .map((app) => {
        const inner = `
          <div class="card-top">
            <div>
              <h3 class="applicant-name">${escapeHtml(app.full_name || 'N/A')}${app.is_best ? '<span class="best-badge">★ Best</span>' : ''}</h3>
              <p class="applicant-role">Organising Committee</p>
            </div>
          </div>
          ${statusBlock('oc', app)}
          <div class="detail-grid">
            <div class="detail-group"><span>Email</span><span>${escapeHtml(app.email)}</span></div>
            <div class="detail-group"><span>WhatsApp</span><span>${escapeHtml(app.phone)}</span></div>
            <div class="detail-group"><span>Instagram</span><span>${escapeHtml(app.instagram_account)}</span></div>
            <div class="detail-group"><span>Institution</span><span>${escapeHtml(app.institution)}</span></div>
            <div class="detail-group"><span>Grade</span><span>${escapeHtml(app.grade)}</span></div>
            <div class="detail-group"><span>Dedication</span><span>${escapeHtml(app.dedication_before_mun)}</span></div>
            <div class="detail-group full"><span>Experience</span><span class="detail-long">${escapeHtml(app.experience)}</span></div>
            <div class="detail-group full highlight-box"><span>Fee / UPI</span><span class="mono">₹${escapeHtml(app.fee_amount || 1699)} · ${escapeHtml(app.transaction_id || 'NOT PROVIDED')}</span></div>
          </div>
          ${notesBlock('oc', app)}
          ${bestBlock('oc', app)}
          ${actionButtons('oc', app)}`;
        return cardShell('oc', app, inner);
      })
      .join('');
    updateBulkBar('oc');
  }

  // --- Bulk ---
  function updateBulkBar(type) {
    const set = state.selected[type];
    const bar = $(`${type}BulkActions`);
    const info = $(`${type}BulkInfo`);
    if (!bar) return;
    if (set.size > 0) {
      bar.classList.add('visible');
      if (info) info.textContent = `${set.size} selected`;
    } else {
      bar.classList.remove('visible');
    }
  }

  function toggleBulkSelect(type, id, checked) {
    const set = state.selected[type];
    if (checked) set.add(id);
    else set.delete(id);
    updateBulkBar(type);
  }

  function selectAllVisible(type, checked) {
    const grid = $(`${type}ApplicationsGrid`);
    if (!grid) return;
    grid.querySelectorAll('.bulk-checkbox').forEach((cb) => {
      cb.checked = checked;
      const id = cb.dataset.bulkId;
      if (checked) state.selected[type].add(id);
      else state.selected[type].delete(id);
    });
    updateBulkBar(type);
  }

  async function bulkUpdateStatus(type, status) {
    const set = state.selected[type];
    if (!set.size) return;
    if (!confirm(`Set ${set.size} application(s) to ${formatStatus(status)}?`)) return;
    try {
      const n = set.size;
      for (const id of set) {
        await supabaseClient.from(TABLE_MAP[type]).update({ status }).eq('id', id);
      }
      set.clear();
      toast(`Updated ${n} applications`);
      await loadApplications();
      filterApplications(type);
    } catch (e) {
      toast('Bulk status update failed', 'error');
    }
  }

  async function bulkMarkBest(type) {
    const set = state.selected[type];
    if (!set.size) return;
    try {
      for (const id of set) {
        await supabaseClient.from(TABLE_MAP[type]).update({ is_best: true }).eq('id', id);
      }
      const n = set.size;
      set.clear();
      toast(`Marked ${n} as best`);
      await loadApplications();
      filterApplications(type);
    } catch (e) {
      toast('Bulk mark failed', 'error');
    }
  }

  async function bulkDelete(type) {
    const set = state.selected[type];
    if (!set.size) return;
    if (!confirm(`Delete ${set.size} application(s)? Cannot be undone.`)) return;
    try {
      for (const id of set) {
        await supabaseClient.from(TABLE_MAP[type]).delete().eq('id', id);
      }
      const n = set.size;
      set.clear();
      toast(`Deleted ${n} applications`);
      await loadApplications();
      filterApplications(type);
    } catch (e) {
      toast('Bulk delete failed', 'error');
    }
  }

  // --- CRUD actions ---
  async function updateStatus(type, id, status) {
    try {
      const { error } = await supabaseClient.from(TABLE_MAP[type]).update({ status }).eq('id', id);
      if (error) throw error;
      const app = getApps(type).find((a) => a.id === id);
      if (app) app.status = status;
      toast('Status updated');
      updateSectionStats();
      if (state.currentView === 'overview') renderOverview();
    } catch (e) {
      toast('Status update failed', 'error');
      loadApplications();
    }
  }

  async function saveNotes(type, id, notes) {
    try {
      const { error } = await supabaseClient.from(TABLE_MAP[type]).update({ admin_notes: notes }).eq('id', id);
      if (error) throw error;
      toast('Notes saved');
    } catch (e) {
      toast('Failed to save notes', 'error');
    }
  }

  async function saveAllocation(type, id) {
    const committee = document.getElementById(`alloc-committee-${id}`)?.value ?? '';
    const portfolio = document.getElementById(`alloc-portfolio-${id}`)?.value ?? '';
    try {
      const { error } = await supabaseClient
        .from(TABLE_MAP[type])
        .update({ allocated_committee: committee, allocated_portfolio: portfolio })
        .eq('id', id);
      if (error) throw error;
      toast('Allocation saved');
      await loadApplications();
      filterApplications(type);
    } catch (e) {
      toast('Allocation save failed', 'error');
    }
  }

  async function deleteApplication(type, id, name) {
    if (!confirm(`Delete ${name}'s application?`)) return;
    try {
      const { error } = await supabaseClient.from(TABLE_MAP[type]).delete().eq('id', id);
      if (error) throw error;
      toast('Application deleted');
      await loadApplications();
      filterApplications(type);
    } catch (e) {
      toast('Delete failed', 'error');
    }
  }

  async function toggleBest(type, id, current) {
    const newVal = !current;
    try {
      const { error } = await supabaseClient.from(TABLE_MAP[type]).update({ is_best: newVal }).eq('id', id);
      if (error) throw error;
      toast(newVal ? 'Marked as best' : 'Removed best mark');
      await loadApplications();
      filterApplications(type);
    } catch (e) {
      toast('Update failed', 'error');
    }
  }

  // --- Email / WhatsApp ---
  function sendTemplatedEmail(type, name, email, templateType, allocation) {
    const website = 'https://onyxmunhyd.in';
    let subject, body;

    if (templateType === 'accept') {
      if (type === 'eb') {
        subject = 'ONYX MUN | Executive Board Application Accepted';
        body = `Dear ${name},\n\nCongratulations! Your EB application at ONYX MUN has been accepted.\n\nPlease confirm within 48 hours.\n\n${website}\n\nONYX MUN Secretariat`;
      } else if (type === 'oc') {
        subject = 'ONYX MUN | Organising Committee Application Accepted';
        body = `Dear ${name},\n\nYour OC application has been accepted. We will contact you with next steps.\n\n${website}\n\nONYX MUN Secretariat`;
      } else {
        const committee = allocation?.committee || 'your assigned committee';
        const portfolio = allocation?.portfolio || 'your assigned portfolio';
        subject = 'ONYX MUN | Delegate Application Accepted';
        body = `Dear ${name},\n\nCongratulations! Your application has been accepted.\n\nCommittee: ${committee}\nPortfolio: ${portfolio}\n\n${website}\n\nONYX MUN Secretariat`;
      }
    } else if (templateType === 'reject') {
      subject = 'ONYX MUN | Application Update';
      body = `Dear ${name},\n\nThank you for applying to ONYX MUN. After careful review, we are unable to proceed with your application at this time.\n\nWe encourage you to apply for future conferences.\n\n${website}\n\nONYX MUN Secretariat`;
    } else {
      subject = 'ONYX MUN | Application Under Review';
      body = `Dear ${name},\n\nYour application is under review. You will receive an update soon.\n\n${website}\n\nONYX MUN Secretariat`;
    }

    window.open(`mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
  }

  function sendWhatsApp(phone, name) {
    if (!phone) {
      toast('No phone number', 'error');
      return;
    }
    let clean = String(phone).replace(/[^0-9]/g, '');
    if (clean.length === 10 && !clean.startsWith('91')) clean = '91' + clean;
    const msg = encodeURIComponent(`Hello ${name}, this is ONYX MUN Secretariat regarding your application.`);
    window.open(`https://wa.me/${clean}?text=${msg}`, '_blank');
  }

  // --- PDF Export ---
  function exportPDF(type) {
    const data = getApps(type);
    if (!data.length) {
      toast('Nothing to export', 'error');
      return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF(type === 'priority' || type === 'oc' ? 'l' : 'p', 'mm', 'a4');
    doc.setFontSize(18);
    doc.setTextColor(212, 175, 55);
    doc.text('ONYX MUN', 14, 15);
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`${VIEWS[type].title} — ${new Date().toLocaleDateString()}`, 14, 24);

    let head, rows;
    if (type === 'eb') {
      head = [['#', 'Name', 'Position', 'Email', 'Phone', 'Institution', 'Date']];
      rows = data.map((a, i) => [
        i + 1,
        a.full_name,
        formatPosition(a.position),
        a.email,
        a.phone,
        a.institution,
        new Date(a.submitted_at).toLocaleDateString(),
      ]);
    } else if (type === 'delegate') {
      head = [['#', 'Name', 'Pref 1', 'Email', 'Phone', 'Institution', 'Date']];
      rows = data.map((a, i) => [
        i + 1,
        a.full_name,
        a.preference_1,
        a.email,
        a.phone,
        a.institution,
        new Date(a.submitted_at).toLocaleDateString(),
      ]);
    } else if (type === 'priority') {
      head = [['#', 'Name', 'Email', 'Txn ID', 'Institution']];
      rows = data.map((a, i) => [i + 1, a.full_name, a.email, a.transaction_id, a.institution]);
    } else {
      head = [['#', 'Name', 'Instagram', 'Phone', 'Email', 'Txn ID']];
      rows = data.map((a, i) => [
        i + 1,
        a.full_name,
        a.instagram_account,
        a.phone,
        a.email,
        a.transaction_id,
      ]);
    }

    doc.autoTable({ head, body: rows, startY: 32, styles: { fontSize: 8 }, headStyles: { fillColor: [212, 175, 55] } });
    doc.save(`ONYX_${type}_${new Date().toISOString().split('T')[0]}.pdf`);
    toast('PDF exported');
  }

  function exportAllPDF() {
    ['eb', 'delegate', 'priority', 'oc'].forEach((t) => {
      if (getApps(t).length) exportPDF(t);
    });
  }

  // --- Event delegation ---
  function handleClick(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const action = btn.dataset.action;
    if (action === 'best' && btn.tagName === 'INPUT') {
      toggleBest(btn.dataset.type, btn.dataset.id, btn.dataset.current === '1');
      return;
    }
    if (action === 'email') {
      sendTemplatedEmail(
        btn.dataset.emailType,
        btn.dataset.name,
        btn.dataset.email,
        btn.dataset.template,
        { committee: btn.dataset.allocCommittee, portfolio: btn.dataset.allocPortfolio }
      );
    } else if (action === 'whatsapp') {
      sendWhatsApp(btn.dataset.phone, btn.dataset.name);
    } else if (action === 'delete') {
      deleteApplication(btn.dataset.type, btn.dataset.id, btn.dataset.name);
    } else if (action === 'allocation') {
      saveAllocation(btn.dataset.type, btn.dataset.id);
    }
  }

  function handleChange(e) {
    const t = e.target;
    if (t.dataset?.action === 'status') {
      updateStatus(t.dataset.type, t.dataset.id, t.value);
    }
    if (t.classList?.contains('bulk-checkbox')) {
      toggleBulkSelect(t.dataset.bulkType, t.dataset.bulkId, t.checked);
    }
    if (t.id?.endsWith('StatusFilter') || t.id?.endsWith('BestFilter')) {
      const type = t.id.replace(/(StatusFilter|BestFilter)$/, '');
      filterApplications(type);
    }
    if (t.dataset?.selectAll) {
      selectAllVisible(t.dataset.selectAll, t.checked);
    }
  }

  function handleInput(e) {
    if (e.target.id?.endsWith('SearchInput')) {
      const type = e.target.id.replace('SearchInput', '');
      filterApplications(type);
    }
  }

  function handleBlur(e) {
    if (e.target.dataset?.action === 'notes') {
      saveNotes(e.target.dataset.type, e.target.dataset.id, e.target.value);
    }
  }

  function initEvents() {
    document.querySelectorAll('.nav-item[data-view]').forEach((btn) => {
      btn.addEventListener('click', () => switchView(btn.dataset.view));
    });

    $('logoutBtn')?.addEventListener('click', logout);
    $('refreshBtn')?.addEventListener('click', () => loadApplications(false));
    $('menuToggle')?.addEventListener('click', () => {
      $('sidebar').classList.toggle('open');
      $('sidebarOverlay').classList.toggle('visible');
    });
    $('sidebarOverlay')?.addEventListener('click', closeSidebar);

    $('topbarExport')?.addEventListener('click', () => {
      const type = $('topbarExport').dataset.exportType;
      if (type && type !== 'overview') exportPDF(type);
    });
    $('exportAllBtn')?.addEventListener('click', exportAllPDF);

    ['eb', 'delegate', 'priority', 'oc'].forEach((type) => {
      $(`${type}BulkAccept`)?.addEventListener('click', () => bulkUpdateStatus(type, 'accepted'));
      $(`${type}BulkReject`)?.addEventListener('click', () => bulkUpdateStatus(type, 'rejected'));
      $(`${type}BulkBest`)?.addEventListener('click', () => bulkMarkBest(type));
      $(`${type}BulkDelete`)?.addEventListener('click', () => bulkDelete(type));
      $(`${type}ExportBtn`)?.addEventListener('click', () => exportPDF(type));
    });

    $('adminApp')?.addEventListener('click', handleClick);
    $('adminApp')?.addEventListener('change', handleChange);
    $('adminApp')?.addEventListener('input', handleInput);
    $('adminApp')?.addEventListener('blur', handleBlur, true);

    $('loginForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const password = $('password').value;
      if (VALID_PASSWORDS.includes(password)) {
        sessionStorage.setItem(SESSION_KEY, 'true');
        $('errorMsg').classList.remove('visible');
        showDashboard();
      } else {
        $('errorMsg').classList.add('visible');
        $('password').value = '';
      }
    });
  }

  window.addEventListener('load', () => {
    setTimeout(() => $('loader')?.classList.add('hidden'), 700);
    initEvents();
    if (sessionStorage.getItem(SESSION_KEY) === 'true') showDashboard();
  });
})();
