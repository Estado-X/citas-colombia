// Pruebas sin dependencias: node --test pruebas/
const test = require('node:test');
const assert = require('node:assert');
const C = require('../assets/citas.js');

const HOY = { anioActual: 2026 };
const buscar = (t) => C.buscar(t, HOY);
const una = (t) => {
  const r = buscar(t);
  assert.strictEqual(r.citas.length, 1, 'Se esperaba una cita en: ' + t + ' → ' + r.citas.map((c) => c.etiqueta).join(', '));
  return r.citas[0];
};
const CC = 'https://www.corteconstitucional.gov.co/relatoria/';
const CSJ = 'https://consultaprovidencias.cortesuprema.gov.co/#/resultados-busqueda/';

// ── Corte Constitucional: formas válidas y su enlace ─────────────────────────────
const validasCC = [
  ['T-406 de 1992', 'T-406 de 1992', CC + '1992/T-406-92.htm'],
  ['Sentencia T-406/92', 'T-406 de 1992', CC + '1992/T-406-92.htm'],
  ['T-406-92', 'T-406 de 1992', CC + '1992/T-406-92.htm'],
  ['T406/92', 'T-406 de 1992', CC + '1992/T-406-92.htm'],
  ['T 406/92', 'T-406 de 1992', CC + '1992/T-406-92.htm'],
  ['T – 406 / 92', 'T-406 de 1992', CC + '1992/T-406-92.htm'],
  ['T-406 del 5 de junio de 1992', 'T-406 de 1992', CC + '1992/T-406-92.htm'],
  ['T-406 de 1992 (5 de junio)', 'T-406 de 1992', CC + '1992/T-406-92.htm'],
  ['C-355 de 2006', 'C-355 de 2006', CC + '2006/C-355-06.htm'],
  ['C-355/06', 'C-355 de 2006', CC + '2006/C-355-06.htm'],
  ['C 355 de 2006', 'C-355 de 2006', CC + '2006/C-355-06.htm'],
  ['Sentencia C-355 del 10 de mayo de 2006', 'C-355 de 2006', CC + '2006/C-355-06.htm'],
  ['SU-214 de 2016', 'SU-214 de 2016', CC + '2016/SU214-16.htm'],
  ['SU214/16', 'SU-214 de 2016', CC + '2016/SU214-16.htm'],
  ['SU.067/93', 'SU-067 de 1993', CC + '1993/SU067-93.htm'],
  ['SU-67 de 1993', 'SU-067 de 1993', CC + '1993/SU067-93.htm'],
  ['T-6/92', 'T-006 de 1992', CC + '1992/T-006-92.htm'],
  ['T-006 de 1992', 'T-006 de 1992', CC + '1992/T-006-92.htm'],
  ['T-1025 de 2007', 'T-1025 de 2007', CC + '2007/T-1025-07.htm'],
  ['T-123 de 2024', 'T-123 de 2024', CC + '2024/T-123-24.htm'],
  ['T-123/24', 'T-123 de 2024', CC + '2024/T-123-24.htm'],
  ['T-001-01', 'T-001 de 2001', CC + '2001/T-001-01.htm'],
  ['Auto 004 de 2009', 'Auto 004 de 2009', CC + 'autos/2009/A004-09.htm'],
  ['auto 004 de 2009', 'Auto 004 de 2009', CC + 'autos/2009/A004-09.htm'],
  ['Auto No. 004/09', 'Auto 004 de 2009', CC + 'autos/2009/A004-09.htm'],
  ['Auto 092 del 14 de abril de 2008', 'Auto 092 de 2008', CC + 'autos/2008/A092-08.htm'],
  ['A-004/09', 'Auto 004 de 2009', CC + 'autos/2009/A004-09.htm'],
  ['A004-09', 'Auto 004 de 2009', CC + 'autos/2009/A004-09.htm'],
  ['A-1000/23', 'Auto 1000 de 2023', CC + 'autos/2023/A1000-23.htm']
];
validasCC.forEach(([texto, etiqueta, url]) => {
  test('Corte Constitucional válida: ' + texto, () => {
    const c = una('Según la ' + texto + ', procede.');
    assert.strictEqual(c.corte, 'cc');
    assert.strictEqual(c.etiqueta, etiqueta);
    assert.strictEqual(c.url, url);
    assert.strictEqual(c.estado, 'ok');
  });
});

// ── Corte Suprema: formas válidas y búsqueda oficial ─────────────────────────────
const validasCSJ = [
  ['SL1234-2023', 'SL1234-2023', 'Laboral'],
  ['AL1234-2023', 'AL1234-2023', 'Laboral'],
  ['CSJ SC5420-2022', 'SC5420-2022', 'Civil'],
  ['AC1234-2023', 'AC1234-2023', 'Civil'],
  ['SP100-2018', 'SP100-2018', 'Penal'],
  ['AP1234-2019', 'AP1234-2019', 'Penal'],
  ['AP1234 de 2019', 'AP1234-2019', 'Penal'],
  ['STC10753-2025', 'STC10753-2025', 'Tutelas'],
  ['STC 10753-2025', 'STC10753-2025', 'Tutelas'],
  ['STL3833-2021', 'STL3833-2021', 'Tutelas'],
  ['STP1234-2021', 'STP1234-2021', 'Tutelas'],
  ['ATC1003-2018', 'ATC1003-2018', 'Tutelas'],
  ['ATL100-2021', 'ATL100-2021', 'Tutelas'],
  ['ATP100-2023', 'ATP100-2023', 'Tutelas'],
  ['SL333-2013', 'SL333-2013', 'Laboral']
];
validasCSJ.forEach(([texto, id, sala]) => {
  test('Corte Suprema válida: ' + texto, () => {
    const c = una('Ver ' + texto + '.');
    assert.strictEqual(c.corte, 'csj');
    assert.strictEqual(c.etiqueta, id);
    assert.strictEqual(c.url, CSJ + '%22' + id + '%22/' + sala);
    assert.strictEqual(c.enlace, 'busqueda');
    assert.strictEqual(c.estado, 'ok');
  });
});

// ── Mal escritas o sospechosas ────────────────────────────────────────────────────
const sospechosas = [
  ['T-406 de 1985', /desde 1992/],
  ['C-100 de 1991', /desde 1992/],
  ['SU-100 de 1992', /primera es la SU-067 de 1993/],
  ['SU-214 de 1991', /desde 1992/],
  ['C-355 de 2031', /2031 todavía no llega/],
  ['T-406/45', /no corresponde a ningún año/],
  ['T-1950 de 2023', /fuera de rango/],
  ['T-0 de 2020', /0 no existe/],
  ['Sentencia T-406', /Falta el año/],
  ['Sentencia CU-123 de 2010', /Tipo inexistente/],
  ['Sentencia SV-12 de 2020', /Tipo inexistente/],
  ['SL1234-2010', /desde 2013/],
  ['SC5420-2030', /2030 todavía no llega/],
  ['SL1234567-2023', /más de cinco cifras/]
];
sospechosas.forEach(([texto, motivo]) => {
  test('Sospechosa: ' + texto, () => {
    const c = una('Como dijo la ' + texto + ', procede.');
    assert.strictEqual(c.estado, 'sospechosa');
    assert.strictEqual(c.url, null, 'Una cita imposible no lleva enlace');
    assert.ok(c.problemas.some((p) => motivo.test(p.texto)), c.problemas.map((p) => p.texto).join(' | '));
  });
});

const raras = [
  ['SL1234-23', /cuatro cifras/, CSJ + '%22SL1234-2023%22/Laboral'],
  ['SL01234-2023', /ceros a la izquierda/, CSJ + '%22SL1234-2023%22/Laboral'],
  ['SC1234-2013', /solo la Sala Laboral/, CSJ + '%22SC1234-2013%22/Civil'],
  ['A-3500/24', /muy alto/, CC + 'autos/2024/A3500-24.htm']
];
raras.forEach(([texto, motivo, url]) => {
  test('Revísala (formato raro): ' + texto, () => {
    const c = una('Ver ' + texto);
    assert.strictEqual(c.estado, 'revisar');
    assert.strictEqual(c.url, url, 'Una cita rara sí lleva enlace');
    assert.ok(c.problemas.some((p) => motivo.test(p.texto)));
  });
});

// ── Textos sin citas: nada de falsos positivos ───────────────────────────────────
const sinCitas = [
  '',
  'El contrato se firmó el 3 de marzo de 2020 en Bogotá.',
  'La Ley 1581 de 2012 y el Decreto 1074 de 2015 regulan los datos personales.',
  'Artículo 86 de la Constitución y Decreto 2591 de 1991.',
  'A 15 de 2020 llegaron los documentos.',
  'Radicado 11001-31-03-001-2020-00123-00, folio 23.',
  'El T-Rex mide 12 metros y el C3PO es un robot.',
  'Llámame al 300 123 4567 o escribe a T. Pérez.',
  'La resolución DIAN 000165 de 2023 trata la factura electrónica.',
  'La talla es S, M o L; el modelo SU-V de Toyota.'
];
sinCitas.forEach((texto) => {
  test('Sin citas: ' + JSON.stringify(texto).slice(0, 50), () => {
    assert.strictEqual(buscar(texto).citas.length, 0, buscar(texto).citas.map((c) => c.etiqueta).join(', '));
  });
});

// ── Varias citas, repetidas y resaltado ──────────────────────────────────────────
test('un escrito con varias citas: una fila por providencia y todas las apariciones', () => {
  const texto = 'La Sentencia T-406 de 1992 fundó el Estado social de derecho. La T-406/92 se reiteró en la ' +
    'SU-214 de 2016 y en el Auto 004 de 2009 (A-004/09). La Corte Suprema, en STC10753-2025, citó la C-355/06. ' +
    'También la inexistente T-1999 de 2023.';
  const r = buscar(texto);
  assert.deepStrictEqual(r.citas.map((c) => c.etiqueta),
    ['T-406 de 1992', 'SU-214 de 2016', 'Auto 004 de 2009', 'STC10753-2025', 'C-355 de 2006', 'T-1999 de 2023']);
  assert.strictEqual(r.citas[0].veces, 2);
  assert.strictEqual(r.citas[2].veces, 2);
  assert.strictEqual(r.apariciones.length, 8);
  r.apariciones.forEach((a) => assert.strictEqual(texto.slice(a.inicio, a.fin), a.escrita));
  assert.strictEqual(r.citas[5].estado, 'sospechosa');
});

test('«STC» no se lee como una C de la Corte Constitucional', () => {
  const r = buscar('STC1234-2023 y AC1234-2023');
  assert.deepStrictEqual(r.citas.map((c) => c.corte), ['csj', 'csj']);
});

test('lista para copiar: enlaces, avisos, fecha dd/mm/aaaa y casillas', () => {
  const r = buscar('T-406 de 1992 y SU-100 de 1992');
  const t = C.lista(r, '06/11/2026', [true, false]);
  assert.match(t, /Citas encontradas: 2 · revisadas el 06\/11\/2026/);
  assert.match(t, /1\. \[x\] Corte Constitucional · T-406 de 1992/);
  assert.match(t, /Ábrela en la relatoría: https:\/\/www\.corteconstitucional\.gov\.co\/relatoria\/1992\/T-406-92\.htm/);
  assert.match(t, /2\. \[ \] Corte Constitucional · SU-100 de 1992/);
  assert.match(t, /Sospechosa: No había sentencias SU en 1992/);
  assert.match(t, /Sin enlace/);
});

test('el año actual sale de la fecha del computador si no se da', () => {
  const futuro = new Date().getFullYear() + 1;
  assert.strictEqual(C.buscar('C-355 de ' + futuro).citas[0].estado, 'sospechosa');
});
