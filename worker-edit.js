(() => {
  const STORE = 'wm_v3';
  const getData = () => { try { return JSON.parse(localStorage.getItem(STORE)) || {workers:[],a:{},p:[]}; } catch(e) { return {workers:[],a:{},p:[]}; } };
  const saveData = d => { localStorage.setItem(STORE, JSON.stringify(d)); localStorage.setItem(STORE + '_backup', JSON.stringify(d)); location.reload(); };
  const monthKey = () => {
    const mo = document.getElementById('mo');
    const yr = document.getElementById('yr');
    const m = String(Number(mo?.value ?? new Date().getMonth()) + 1).padStart(2,'0');
    const y = Number(yr?.value ?? new Date().getFullYear());
    return `${y}-${m}`;
  };
  const daysInMonth = () => {
    const mo = document.getElementById('mo');
    const yr = document.getElementById('yr');
    return new Date(Number(yr?.value ?? new Date().getFullYear()), Number(mo?.value ?? new Date().getMonth()) + 1, 0).getDate();
  };
  const money = n => Number(n || 0).toLocaleString('en-IN');
  const enhanceWorkers = () => {
    const list = document.getElementById('wlist');
    if (!list) return;
    const d = getData();
    list.querySelectorAll('.worker').forEach(card => {
      const profile = card.querySelector('button[onclick^="openProfile("]');
      if (!profile) return;
      const m = profile.getAttribute('onclick').match(/openProfile\((\d+)\)/);
      if (!m) return;
      const id = Number(m[1]);
      if (!card.dataset.enhanced) {
        card.dataset.enhanced = '1';
        const edit = document.createElement('button');
        edit.textContent = '✏️ Edit';
        edit.onclick = () => {
          const d2 = getData(), w = d2.workers.find(x => x.id === id);
          if (!w) return;
          const name = prompt('Enter new worker name:', w.name);
          if (name === null) return;
          const clean = name.trim();
          if (!clean) { alert('Worker name cannot be empty.'); return; }
          w.name = clean;
          saveData(d2);
        };
        const del = document.createElement('button');
        del.textContent = '🗑️ Delete';
        del.onclick = () => {
          const d2 = getData(), w = d2.workers.find(x => x.id === id);
          if (!w) return;
          const ok = confirm(`⚠️ Delete worker "${w.name}"?\n\nThis will permanently delete the worker and their attendance and payment history from this phone.\n\nAre you sure?`);
          if (!ok) return;
          d2.workers = d2.workers.filter(x => x.id !== id);
          Object.keys(d2.a || {}).forEach(k => { if (k.startsWith(id + '|')) delete d2.a[k]; });
          d2.p = (d2.p || []).filter(x => x.id !== id);
          saveData(d2);
        };
        profile.parentNode.insertBefore(edit, profile.nextSibling);
        profile.parentNode.appendChild(del);
      }
      // Salary is intentionally NOT shown on the Workers page.
      const detail = card.querySelector('.small');
      if (detail) detail.textContent = `Worked ${workedFor(id)}`;
    });
  };
  const workedFor = id => {
    const d = getData(), keyMonth = monthKey(), days = daysInMonth();
    let n = 0;
    for (let day=1; day<=days; day++) {
      const k = `${id}|${keyMonth}-${String(day).padStart(2,'0')}`;
      if (d.a?.[k] === 'P') n += 1;
      if (d.a?.[k] === 'H') n += 0.5;
    }
    return n % 1 ? `${Math.floor(n)}½` : String(n);
  };
  const profileId = () => {
    const title = document.getElementById('pname');
    if (!title) return null;
    const d = getData();
    const w = d.workers.find(x => x.name === title.textContent);
    return w?.id ?? null;
  };
  const enhanceProfile = () => {
    const box = document.getElementById('pstats');
    const title = document.getElementById('pname');
    if (!box || !title || !document.getElementById('profile')?.classList.contains('on')) return;
    const d = getData();
    const w = d.workers.find(x => x.name === title.textContent);
    if (!w) return;
    const mk = monthKey(), days = daysInMonth();
    if (!w.salaryByMonth) w.salaryByMonth = {};
    const salary = Number(w.salaryByMonth[mk] || 0);
    let present=0, absent=0, half=0;
    for (let day=1; day<=days; day++) {
      const a = d.a?.[`${w.id}|${mk}-${String(day).padStart(2,'0')}`] || '';
      if (a==='P') present++;
      if (a==='A') absent++;
      if (a==='H') half++;
    }
    const worked = present + half/2;
    const daily = salary / days;
    const deduction = (absent + half/2) * daily;
    const earned = Math.max(0, salary - deduction);
    const paid = (d.p || []).filter(x => x.id === w.id && String(x.date).startsWith(mk+'-')).reduce((s,x)=>s + Number(x.amount || 0),0);
    const balance = earned - paid;
    box.innerHTML = `
      <div class="stat" style="grid-column:1/-1;background:#eff6ff">
        <div class="small">${document.getElementById('mo')?.selectedOptions[0]?.text || ''} ${document.getElementById('yr')?.value || ''} Fixed Salary</div>
        <div style="font-size:22px;font-weight:800">₹${money(salary)}</div>
        <button class="primary" style="margin-top:8px" id="salaryBtn">${salary ? '✏️ Change Salary' : '＋ Set Monthly Salary'}</button>
      </div>
      <div class="stat"><b>${worked % 1 ? Math.floor(worked)+'½' : worked}</b><div class="small">Days Worked</div></div>
      <div class="stat"><b>${absent}</b><div class="small">Absent</div></div>
      <div class="stat"><b>${half}</b><div class="small">Half Days</div></div>
      <div class="stat"><b>₹${money(deduction)}</b><div class="small">Deduction</div></div>
      <div class="stat"><b>₹${money(earned)}</b><div class="small">Salary Earned</div></div>
      <div class="stat"><b>₹${money(paid)}</b><div class="small">Paid</div></div>
      <div class="stat"><b>₹${money(balance)}</b><div class="small">${balance >= 0 ? 'Remaining' : 'Overpaid'}</div></div>`;
    document.getElementById('salaryBtn').onclick = () => {
      const d2 = getData(), ww = d2.workers.find(x => x.id === w.id);
      if (!ww) return;
      if (!ww.salaryByMonth) ww.salaryByMonth = {};
      const current = Number(ww.salaryByMonth[mk] || 0);
      const answer = prompt(`Set fixed monthly salary for ${mk}:`, current || '');
      if (answer === null) return;
      const value = Number(String(answer).replace(/,/g,''));
      if (!Number.isFinite(value) || value < 0) { alert('Enter a valid salary amount.'); return; }
      ww.salaryByMonth[mk] = value;
      saveData(d2);
    };
  };
  const enhance = () => { enhanceWorkers(); enhanceProfile(); };
  const obs = new MutationObserver(enhance);
  obs.observe(document.body, {childList:true, subtree:true});
  document.addEventListener('change', enhance);
  enhance();
})();
