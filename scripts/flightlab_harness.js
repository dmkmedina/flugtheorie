/* Headless smoke test for flight-lab.html.
   Build a test copy: python3 -c "h=open('flight-lab.html').read(); open('flight-lab.test.html','w').write(h.replace('</body>','<script src=\"scripts/flightlab_harness.js\"></script></body>'))"
   Run: chrome --headless=new --dump-dom flight-lab.test.html  (assertions land in <pre id="test-output">)
   Screenshots: append ?shot=<lessonId> and use --screenshot. */
(function () {
  const out = [];
  const errors = [];
  window.addEventListener('error', e => errors.push(e.message));

  const shot = new URLSearchParams(location.search).get('shot');
  if (shot) { try { switchLesson(shot); } catch (e) { errors.push(String(e)); } return; }

  try {
    const ids = ['forces', 'polar', 'wind', 'thermal', 'stability', 'cloudbase', 'foehn', 'airspace', 'anatomy'];
    ids.forEach(id => {
      switchLesson(id);
      for (let i = 0; i < 6; i++) lesson.update(0.016);
      const ros = document.querySelectorAll('.ro').length;
      out.push(`${stage.children.length > 0 ? 'PASS' : 'FAIL'} lesson ${id}: stage=${stage.children.length} readouts=${ros}`);
      (lesson.params || []).forEach(p => { state[p.key] = p.max; });
      for (let i = 0; i < 6; i++) lesson.update(0.016);
      (lesson.params || []).forEach(p => { state[p.key] = p.min; });
      for (let i = 0; i < 4; i++) lesson.update(0.016);
      out.push(`PASS lesson ${id}: param sweep`);
    });

    switchLesson('anatomy');
    lesson.select('A');
    const pi = document.getElementById('part-info');
    out.push((pi && pi.textContent.includes('A-lines') ? 'PASS' : 'FAIL') + ' anatomy part select shows info');

    switchLesson('airspace');
    state.alps = true; state.mil = true;
    lesson.update(0.016);
    state.alt = 4200;
    lesson.update(0.016);
    const roTxt = document.getElementById('readouts').textContent;
    out.push((roTxt.includes('C / controlled') ? 'PASS' : 'FAIL') + ' airspace: 4200 m in Alps MIL ON is controlled');
    state.alt = 700;
    lesson.update(0.016);
    out.push((document.getElementById('readouts').textContent.includes('G') ? 'PASS' : 'FAIL') + ' airspace: 700 m AMSL is class G');

    switchLesson('polar');
    state.c = 1.04;
    for (let i = 0; i < 10; i++) lesson.update(0.016);
    out.push((document.getElementById('readouts').textContent.includes('STALL') ? 'PASS' : 'FAIL') + ' polar: full brake shows stall');

    switchLesson('stability');
    state.lapse = 0.9; state.inv = true; state.invh = 800;
    lesson.update(0.016);
    out.push((lesson._top >= 800 && lesson._top <= 1100 ? 'PASS' : 'FAIL') + ` stability: thermal stops inside the 800–1100 m inversion layer (top=${lesson._top})`);
    state.inv = false;
    lesson.update(0.016);
    out.push((lesson._top >= 1900 ? 'PASS' : 'FAIL') + ` stability: no inversion, lapse 0.9 → high top (top=${lesson._top})`);

    switchLesson('cloudbase');
    state.t = 24; state.dp = 16;
    lesson.update(0.016);
    out.push((document.getElementById('readouts').textContent.includes('1000') ? 'PASS' : 'FAIL') + ' cloudbase: spread 8 °C → base 1000 m');

    switchLesson('foehn');
    state.spread = 5;
    lesson.update(0.016);
    out.push((lesson._lee > 18 && lesson._lee < 23 ? 'PASS' : 'FAIL') + ` foehn: lee valley warmer than windward (lee=${lesson._lee && lesson._lee.toFixed(1)} °C)`);
  } catch (err) {
    out.push('THREW: ' + (err && err.stack || err));
  }
  out.push('JS errors: ' + (errors.length ? errors.join(' | ') : 'none'));
  const pre = document.createElement('pre');
  pre.id = 'test-output';
  pre.textContent = out.join('\n');
  document.body.appendChild(pre);
})();
