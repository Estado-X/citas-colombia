/* Encuentra en un texto las citas de la Corte Constitucional y de la Corte Suprema de Justicia,
   arma el enlace a la relatoría oficial de cada una y marca las que están mal escritas o no pueden existir.
   No consulta internet: solo lee el texto. Funciona igual en el navegador y en Node (pruebas). */
(function (raiz) {
  'use strict';

  // ── Lo que se sabe de cada corte (revisado en las relatorías oficiales) ──────────────
  var CC_INICIO = 1992;        // primeras sentencias y autos en la relatoría de la Corte Constitucional
  var CC_SU_INICIO = 1993;     // primera sentencia de unificación: SU-067 de 1993
  var CC_MAX_SENTENCIA = 1800; // la numeración anual más alta ronda la 1.750 (año 2000)
  var CC_MAX_AUTO = 3000;      // los autos pasan de 2.000 en algunos años
  var CSJ_INICIO = 2013;       // Sala Laboral desde 2013; Civil, Penal y tutelas desde 2014

  // Corte Suprema: prefijo → nombre y sala del buscador oficial
  var CSJ = {
    SC: ['Sentencia de la Sala de Casación Civil', 'Civil'],
    AC: ['Auto de la Sala de Casación Civil', 'Civil'],
    SL: ['Sentencia de la Sala de Casación Laboral', 'Laboral'],
    AL: ['Auto de la Sala de Casación Laboral', 'Laboral'],
    SP: ['Sentencia de la Sala de Casación Penal', 'Penal'],
    AP: ['Auto de la Sala de Casación Penal', 'Penal'],
    STC: ['Sentencia de tutela de la Sala Civil', 'Tutelas'],
    STL: ['Sentencia de tutela de la Sala Laboral', 'Tutelas'],
    STP: ['Sentencia de tutela de la Sala Penal', 'Tutelas'],
    ATC: ['Auto de tutela de la Sala Civil', 'Tutelas'],
    ATL: ['Auto de tutela de la Sala Laboral', 'Tutelas'],
    ATP: ['Auto de tutela de la Sala Penal', 'Tutelas']
  };
  var CC_TIPOS = { T: 'Sentencia de tutela', C: 'Sentencia de constitucionalidad', SU: 'Sentencia de unificación', A: 'Auto' };

  var CC_URL = 'https://www.corteconstitucional.gov.co/relatoria/';
  var CSJ_URL = 'https://consultaprovidencias.cortesuprema.gov.co/#/resultados-busqueda/';

  // ── Patrones ──────────────────────────────────────────────────────────────────
  var L = 'A-Za-zÁÉÍÓÚÜÑáéíóúüñ';           // letras, para que «STC» no se lea como «C»
  var ANTES = '(?<![' + L + '0-9])';
  var GUION = '[-‐‑–—]';
  // «del 10 de mayo de 2006» después del número
  var FECHA = ',?\\s+del?\\s+\\d{1,2}\\s+de\\s+(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)\\s+(?:del?\\s+)?(\\d{4})';
  var PCSJ = Object.keys(CSJ).sort(function (a, b) { return b.length - a.length; }).join('|');

  // SL1234-2023 · STC 10753-2025 · AP1234 de 2019 · SL1234-23 (raro)
  var RE_CSJ = new RegExp(ANTES + '(' + PCSJ + ')\\s?(\\d{1,7})\\s?(?:' + GUION + '\\s?|\\s+del?\\s+)(\\d{4}|\\d{2})(?!\\d)', 'g');
  // T-406 de 1992 · T-406/92 · SU214-16 · SU.067/93 · C 355 de 2006 · A-004/09 · T-406 (sin año)
  var RE_CC = new RegExp(ANTES + '(SU|T|C|A)(\\s?' + GUION + '\\s?|\\.\\s?|\\s)?(\\d{1,5})' +
    '(?:\\s?(?:\\/|' + GUION + ')\\s?(\\d{4}|\\d{2})|\\s+del?\\s+(?:año\\s+)?(\\d{4})|' + FECHA + ')?(?![\\d' + L + '])', 'g');
  // Auto 004 de 2009 · auto No. 004/09 · Auto número 092 de 2008
  var RE_AUTO = new RegExp('(?<![' + L + '])([Aa]uto)\\s+(?:(?:No\\.?|Nro\\.?|n[úu]mero|N\\.?\\s?[°º]|n\\.?\\s?[°º])\\s*)?(\\d{1,5})' +
    '(?:\\s?(?:\\/|' + GUION + ')\\s?(\\d{4}|\\d{2})|\\s+del?\\s+(?:año\\s+)?(\\d{4})|' + FECHA + ')(?!\\d)', 'g');
  // Sentencia XY-123 de 2010 con un tipo que no existe (CU, TS, SV…)
  var RE_OTRO = new RegExp('(?<![' + L + '])(?:[Ss]entencias?|[Aa]utos?|[Ff]allos?|[Pp]rovidencias?)\\s+(?:de\\s+(?:tutela|unificación|constitucionalidad)\\s+)?' +
    '([A-Z]{1,4})\\s?' + GUION + '?\\s?(\\d{1,5})(?:\\s?(?:\\/|' + GUION + ')\\s?(\\d{4}|\\d{2})|\\s+del?\\s+(\\d{4}))?(?![\\d' + L + '])', 'g');
  var RE_PALABRA = /(?:sentencias?|autos?|fallos?|providencias?)(?:\s+de\s+(?:tutela|unificación|constitucionalidad))?\s*$/i;

  function pad(n, k) { n = String(n); while (n.length < k) n = '0' + n; return n; }
  function miles(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }

  // Año de dos cifras en la Corte Constitucional: 92–99 → 1992–1999; 00–91 → 2000–2091
  function anioCC(txt) {
    if (txt.length === 4) return +txt;
    var yy = +txt;
    return yy >= 92 ? 1900 + yy : 2000 + yy;
  }

  function problema(nivel, texto) { return { nivel: nivel, texto: texto }; }

  // ── Corte Constitucional ─────────────────────────────────────────────────────────
  function citaCC(tipo, numTxt, anioTxt, hoyAnio) {
    var n = +numTxt, problemas = [];
    var esAuto = tipo === 'A';
    var anio = anioTxt ? anioCC(anioTxt) : null;
    var etiqueta, url = null;

    if (n === 0) problemas.push(problema('error', 'El número 0 no existe.'));
    if (numTxt.length > 4 && numTxt.charAt(0) === '0') problemas.push(problema('aviso', 'Formato raro: sobran ceros a la izquierda.'));
    if (!esAuto && n > CC_MAX_SENTENCIA) problemas.push(problema('error', 'Número fuera de rango: la numeración de un año en la Corte Constitucional no ha pasado de unas 1.750 sentencias.'));
    if (esAuto && n > CC_MAX_AUTO) problemas.push(problema('aviso', 'Número muy alto para un auto de la Corte Constitucional. Revisa que esté bien escrito.'));

    if (anio === null) {
      problemas.push(problema('error', 'Falta el año: sin el año no se puede saber cuál es.'));
    } else if (anio > hoyAnio) {
      problemas.push(problema('error', anioTxt.length === 2 && +anioTxt < 92
        ? '«' + anioTxt + '» no corresponde a ningún año de la Corte Constitucional, que empezó en 1992.'
        : 'Año imposible: ' + anio + ' todavía no llega.'));
    } else if (anio < CC_INICIO) {
      problemas.push(problema('error', 'Año imposible: la Corte Constitucional dicta sentencias desde 1992.'));
    } else if (tipo === 'SU' && anio < CC_SU_INICIO) {
      problemas.push(problema('error', 'No había sentencias SU en ' + anio + ': la primera es la SU-067 de 1993.'));
    }

    var num = n < 1000 ? pad(n, 3) : String(n);
    if (esAuto) etiqueta = 'Auto ' + num + (anio ? ' de ' + anio : '');
    else etiqueta = tipo + '-' + num + (anio ? ' de ' + anio : '');

    var grave = problemas.some(function (p) { return p.nivel === 'error'; });
    if (!grave && anio) {
      var yy = pad(anio % 100, 2);
      if (esAuto) url = CC_URL + 'autos/' + anio + '/A' + num + '-' + yy + '.htm';
      else if (tipo === 'SU') url = CC_URL + anio + '/SU' + num + '-' + yy + '.htm';
      else url = CC_URL + anio + '/' + tipo + '-' + num + '-' + yy + '.htm';
    }
    return {
      corte: 'cc', corteNombre: 'Corte Constitucional', tipo: tipo, tipoNombre: CC_TIPOS[tipo],
      numero: n, anio: anio, clave: 'cc:' + tipo + ':' + n + ':' + (anio || '?'),
      etiqueta: etiqueta, url: url, enlace: url ? 'directo' : null, problemas: problemas
    };
  }

  // ── Corte Suprema de Justicia ─────────────────────────────────────────────────────
  function citaCSJ(pref, numTxt, anioTxt, hoyAnio) {
    var n = +numTxt, problemas = [], anio;
    if (anioTxt.length === 2) {
      anio = 2000 + +anioTxt;
      problemas.push(problema('aviso', 'Formato raro: la Corte Suprema escribe el año con cuatro cifras (' + pref + n + '-' + anio + ').'));
    } else anio = +anioTxt;

    if (n === 0) problemas.push(problema('error', 'El número 0 no existe.'));
    if (numTxt.length > 1 && numTxt.charAt(0) === '0') problemas.push(problema('aviso', 'Formato raro: la Corte Suprema no escribe ceros a la izquierda.'));
    if (String(n).length > 5) problemas.push(problema('error', 'Número fuera de rango: tiene más de cinco cifras.'));

    if (anio > hoyAnio) problemas.push(problema('error', 'Año imposible: ' + anio + ' todavía no llega.'));
    else if (anio < CSJ_INICIO) problemas.push(problema('error', 'Formato imposible para ' + anio + ': la Corte Suprema usa este identificador desde 2013 (Sala Laboral) y 2014 (las demás salas). Antes citaba con el radicado y la fecha.'));
    else if (anio === 2013 && pref !== 'SL' && pref !== 'AL') problemas.push(problema('aviso', 'En 2013 solo la Sala Laboral usaba este identificador; las demás salas empezaron en 2014. Revisa el año.'));

    var id = pref + n + '-' + anio;
    var grave = problemas.some(function (p) { return p.nivel === 'error'; });
    var url = grave ? null : CSJ_URL + encodeURIComponent('"' + id + '"') + '/' + CSJ[pref][1];
    return {
      corte: 'csj', corteNombre: 'Corte Suprema de Justicia', tipo: pref, tipoNombre: CSJ[pref][0],
      numero: n, anio: anio, clave: 'csj:' + id, etiqueta: id, url: url, enlace: url ? 'busqueda' : null,
      problemas: problemas
    };
  }

  function citaOtra(tipo, numTxt, anioTxt) {
    var etiqueta = tipo + '-' + numTxt + (anioTxt ? (anioTxt.length === 4 ? ' de ' : '/') + anioTxt : '');
    return {
      corte: 'otra', corteNombre: 'Sin corte reconocida', tipo: tipo, tipoNombre: 'Tipo desconocido',
      numero: +numTxt, anio: anioTxt ? +anioTxt : null, clave: 'otra:' + etiqueta, etiqueta: etiqueta, url: null, enlace: null,
      problemas: [problema('error', 'Tipo inexistente: «' + tipo + '» no es un tipo de providencia de la Corte Constitucional (T, C, SU o auto) ni de la Corte Suprema (SC, SL, SP, AC, AL, AP, STC, STL, STP, ATC, ATL, ATP).')]
    };
  }

  // ── Búsqueda ──────────────────────────────────────────────────────────────────
  function todas(re, texto, fn) {
    var out = [], m;
    re.lastIndex = 0;
    while ((m = re.exec(texto)) !== null) {
      var r = fn(m);
      if (r) out.push(r);
      if (m[0].length === 0) re.lastIndex++;
    }
    return out;
  }

  function buscar(texto, opciones) {
    texto = String(texto || '');
    var hoyAnio = (opciones && opciones.anioActual) || new Date().getFullYear();
    var cand = [];

    cand = cand.concat(todas(RE_CSJ, texto, function (m) {
      return { inicio: m.index, fin: m.index + m[0].length, prioridad: 3, cita: citaCSJ(m[1], m[2], m[3], hoyAnio) };
    }));
    cand = cand.concat(todas(RE_AUTO, texto, function (m) {
      return { inicio: m.index, fin: m.index + m[0].length, prioridad: 2, cita: citaCC('A', m[2], m[3] || m[4] || m[5], hoyAnio) };
    }));
    cand = cand.concat(todas(RE_CC, texto, function (m) {
      var tipo = m[1], sep = m[2], numTxt = m[3], anioTxt = m[4] || m[5] || m[6];
      var previo = texto.slice(Math.max(0, m.index - 40), m.index);
      var conPalabra = RE_PALABRA.test(previo);
      // Sin año, solo cuenta si viene después de «Sentencia» o «Auto»
      if (!anioTxt && !conPalabra) return null;
      // «A 15 de 2020» suelto no es una cita: con espacio y sin «Sentencia» o «Auto» antes, solo T, C o SU
      if (sep && /^\s$/.test(sep) && !conPalabra && tipo === 'A') return null;
      return { inicio: m.index, fin: m.index + m[0].length, prioridad: 1, cita: citaCC(tipo, numTxt, anioTxt, hoyAnio) };
    }));
    cand = cand.concat(todas(RE_OTRO, texto, function (m) {
      var tipo = m[1];
      if (CC_TIPOS[tipo] || CSJ[tipo]) return null;
      if (/^(N|NO|NRO)$/.test(tipo)) return null;
      var ini = m.index + m[0].lastIndexOf(tipo, m[0].length - m[2].length);
      return { inicio: ini, fin: m.index + m[0].length, prioridad: 0, cita: citaOtra(tipo, m[2], m[3] || m[4]) };
    }));

    // Sin cruces: gana la que empieza antes; si empiezan igual, la más larga y luego la de más prioridad
    cand.sort(function (a, b) { return a.inicio - b.inicio || (b.fin - b.inicio) - (a.fin - a.inicio) || b.prioridad - a.prioridad; });
    var elegidas = [], fin = -1;
    cand.forEach(function (c) {
      if (c.inicio >= fin) { elegidas.push(c); fin = c.fin; }
    });

    // Una fila por providencia, con cuántas veces aparece
    var citas = [], porClave = {}, apariciones = [];
    elegidas.forEach(function (c) {
      var k = c.cita.clave, i = porClave[k];
      if (i === undefined) {
        i = citas.length; porClave[k] = i;
        var cita = c.cita;
        cita.veces = 0; cita.escritas = [];
        cita.estado = cita.problemas.some(function (p) { return p.nivel === 'error'; }) ? 'sospechosa'
          : (cita.problemas.length ? 'revisar' : 'ok');
        citas.push(cita);
      }
      var escrita = texto.slice(c.inicio, c.fin);
      citas[i].veces++;
      if (citas[i].escritas.indexOf(escrita) < 0) citas[i].escritas.push(escrita);
      apariciones.push({ inicio: c.inicio, fin: c.fin, indice: i, escrita: escrita });
    });
    return { citas: citas, apariciones: apariciones };
  }

  // Texto para copiar la lista
  function lista(resultado, fecha, marcadas) {
    var r = resultado, lineas = [];
    var n = r.citas.length;
    lineas.push('Citas encontradas: ' + n + (fecha ? ' · revisadas el ' + fecha : ''));
    lineas.push('');
    r.citas.forEach(function (c, i) {
      var caja = marcadas ? (marcadas[i] ? '[x] ' : '[ ] ') : '';
      var veces = c.veces > 1 ? ' · aparece ' + c.veces + ' veces' : '';
      lineas.push((i + 1) + '. ' + caja + c.corteNombre + ' · ' + c.etiqueta + veces);
      if (c.estado !== 'ok') {
        c.problemas.forEach(function (p) { lineas.push('   ' + (p.nivel === 'error' ? 'Sospechosa: ' : 'Revísala: ') + p.texto); });
      }
      if (c.url) lineas.push('   ' + (c.enlace === 'busqueda' ? 'Búscala en la Corte Suprema (mira que el primer resultado tenga ese nombre): ' : 'Ábrela en la relatoría: ') + c.url);
      else lineas.push('   Sin enlace: corrige la cita antes de buscarla.');
    });
    lineas.push('');
    lineas.push('Un enlace que no abre la providencia puede ser una cita inventada. Ábrelos todos antes de usar el escrito.');
    return lineas.join('\n');
  }

  var api = { buscar: buscar, lista: lista, miles: miles, CSJ: CSJ, CC_TIPOS: CC_TIPOS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else raiz.Citas = api;
})(this);
