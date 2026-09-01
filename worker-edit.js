(() => {
  const STORE = 'wm_v3';
  const getData = () => { try { return JSON.parse(localStorage.getItem(STORE)) || {workers:[],a:{},p:[]}; } catch(e) { return {workers:[],a:{},p:[]}; } };
  const saveData = d => { localStorage.setItem(STORE, JSON.stringify(d)); localStorage.setItem(STORE + '_backup', JSON.stringify(d)); location.reload(); };
  function enhance() {
    const list = document.getElementById('wlist');
    if (!list) return;
    list.querySelectorAll('.worker').forEach(card => {
      if (card.dataset.enhanced) return;
      const profile = card.querySelector('button[onclick^="openProfile("]');
      if (!profile) return;
      const m = profile.getAttribute('onclick').match(/openProfile\((\d+)\)/);
      if (!m) return;
      const id = Number(m[1]);
      card.dataset.enhanced = '1';
      const edit = document.createElement('button');
      edit.textContent = '✏️ Edit';
      edit.onclick = () => {
        const d = getData(), w = d.workers.find(x => x.id === id);
        if (!w) return;
        const name = prompt('Enter new worker name:', w.name);
        if (name === null) return;
        const clean = name.trim();
        if (!clean) { alert('Worker name cannot be empty.'); return; }
        w.name = clean;
        saveData(d);
      };
      const del = document.createElement('button');
      del.textContent = '🗑️ Delete';
      del.onclick = () => {
        const d = getData(), w = d.workers.find(x => x.id === id);
        if (!w) return;
        const ok = confirm(`⚠️ Delete worker "${w.name}"?\n\nThis will permanently delete the worker and their attendance and payment history from this phone.\n\nAre you sure?`);
        if (!ok) return;
        d.workers = d.workers.filter(x => x.id !== id);
        Object.keys(d.a || {}).forEach(k => { if (k.startsWith(id + '|')) delete d.a[k]; });
        d.p = (d.p || []).filter(x => x.id !== id);
        saveData(d);
      };
      profile.parentNode.insertBefore(edit, profile.nextSibling);
      profile.parentNode.appendChild(del);
    });
  }
  const obs = new MutationObserver(enhance);
  obs.observe(document.body, {childList:true, subtree:true});
  enhance();
})();
