/* Interfaz: lee el texto, resalta las citas y arma la lista con los enlaces.
   No guarda nada: al cerrar la página, se borra. */
(function () {
  'use strict';

  var C = window.Citas;
  var $ = function (s) { return document.querySelector(s); };

  // Ejemplo con citas reales y otras que no pueden existir
  var EJEMPLO = 'Señor juez:\n\n' +
    'Interpongo acción de tutela para proteger el derecho a la salud de mi madre. Así lo ha reconocido la jurisprudencia ' +
    'constitucional en la Sentencia T-760 de 2008 y en la SU-214/16, y desde la T-406/92 la Corte ha explicado el papel del juez ' +
    'en el Estado social de derecho. También es pertinente el Auto 004 de 2009.\n\n' +
    'La Corte Suprema de Justicia ha tratado casos parecidos en la STP1234-2021 y en el AL1234-2023.\n\n' +
    'Por último, la Sentencia T-1873 de 2019 y la SU-118 de 1992 establecieron que la EPS debe autorizar el servicio ' +
    'en 48 horas, como lo confirmó la SC4512-2031.';

  var texto = $('#texto');
  var resultado = { citas: [], apariciones: [] };
  var marcadas = [];
  var ESTADOS = { ok: 'Formato correcto', revisar: 'Revísala', sospechosa: 'Sospechosa' };

  function hoy() {
    var d = new Date();
    var dd = function (n) { return (n < 10 ? '0' : '') + n; };
    return dd(d.getDate()) + '/' + dd(d.getMonth() + 1) + '/' + d.getFullYear();
  }

  function el(tag, clase, contenido) {
    var n = document.createElement(tag);
    if (clase) n.className = clase;
    if (contenido !== undefined) n.textContent = contenido;
    return n;
  }

  function pintarTexto(t) {
    var pre = $('#marcado');
    pre.textContent = '';
    var pos = 0;
    resultado.apariciones.forEach(function (a) {
      if (a.inicio > pos) pre.appendChild(document.createTextNode(t.slice(pos, a.inicio)));
      var cita = resultado.citas[a.indice];
      var m = el('mark', 'cita cita--' + cita.estado, a.escrita);
      m.setAttribute('data-i', a.indice);
      m.title = cita.etiqueta + ' · ' + ESTADOS[cita.estado];
      var junta = el('span', 'junta');
      junta.appendChild(m);
      var n = el('span', 'num', String(a.indice + 1));
      n.setAttribute('aria-hidden', 'true');
      junta.appendChild(n);
      pre.appendChild(junta);
      pos = a.fin;
    });
    if (pos < t.length) pre.appendChild(document.createTextNode(t.slice(pos)));
  }

  function pintarResumen() {
    var ul = $('#resumen');
    ul.textContent = '';
    var cuenta = { ok: 0, revisar: 0, sospechosa: 0 };
    resultado.citas.forEach(function (c) { cuenta[c.estado]++; });
    var total = resultado.citas.length;
    var items = [['', total, total === 1 ? 'cita' : 'citas']];
    if (total) {
      items.push(['r-ok', cuenta.ok, 'con formato correcto']);
      items.push(['r-rev', cuenta.revisar, 'para revisar']);
      items.push(['r-mal', cuenta.sospechosa, cuenta.sospechosa === 1 ? 'sospechosa' : 'sospechosas']);
    }
    items.forEach(function (it) {
      var li = el('li', it[0]);
      li.appendChild(el('b', '', C.miles(it[1])));
      li.appendChild(document.createTextNode(it[2]));
      ul.appendChild(li);
    });
  }

  function verEnTexto(i) {
    var marcas = document.querySelectorAll('mark.cita[data-i="' + i + '"]');
    if (!marcas.length) return;
    Array.prototype.forEach.call(document.querySelectorAll('mark.foco'), function (m) { m.classList.remove('foco'); });
    Array.prototype.forEach.call(marcas, function (m) { m.classList.add('foco'); });
    marcas[0].scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  function pintarLista() {
    var ol = $('#citas');
    ol.textContent = '';
    resultado.citas.forEach(function (c, i) {
      var li = el('li', 'cita-item cita-item--' + c.estado);
      var cab = el('div', 'cita-item__cab');
      cab.appendChild(el('span', 'num', String(i + 1)));
      cab.appendChild(el('span', 'cita-item__id', c.etiqueta));
      cab.appendChild(el('span', 'estado estado--' + c.estado, ESTADOS[c.estado]));
      li.appendChild(cab);
      li.appendChild(el('span', 'cita-item__corte', c.corteNombre + ' · ' + c.tipoNombre));

      var esc = el('p', 'cita-item__escrita');
      esc.appendChild(document.createTextNode(c.veces > 1 ? 'Aparece ' + c.veces + ' veces, escrita como ' : 'Escrita como '));
      c.escritas.forEach(function (e, k) {
        if (k) esc.appendChild(document.createTextNode(' y '));
        esc.appendChild(el('code', '', e));
      });
      li.appendChild(esc);

      if (c.problemas.length) {
        var ul = el('ul', 'problemas');
        c.problemas.forEach(function (p) { ul.appendChild(el('li', p.nivel === 'error' ? 'p-error' : 'p-aviso', p.texto)); });
        li.appendChild(ul);
      }

      var pie = el('div', 'cita-item__pie');
      if (c.url) {
        var a = el('a', 'abrir', c.enlace === 'busqueda' ? 'Buscarla en la Corte Suprema' : 'Abrirla en la relatoría');
        a.href = c.url; a.target = '_blank'; a.rel = 'noopener';
        a.setAttribute('aria-label', (c.enlace === 'busqueda' ? 'Buscar ' : 'Abrir ') + c.etiqueta + ' en la relatoría oficial (se abre en otra pestaña)');
        pie.appendChild(a);
        var lab = el('label', 'revisada');
        var chk = document.createElement('input');
        chk.type = 'checkbox'; chk.checked = !!marcadas[i];
        chk.addEventListener('change', function () { marcadas[i] = chk.checked; });
        lab.appendChild(chk);
        lab.appendChild(document.createTextNode('La abrí y existe'));
        pie.appendChild(lab);
      } else {
        pie.appendChild(el('span', 'sin-enlace', 'Sin enlace: corrige la cita antes de buscarla.'));
      }
      var ver = el('button', 'ver', 'Verla en el texto');
      ver.type = 'button';
      ver.addEventListener('click', function () { verEnTexto(i); });
      pie.appendChild(ver);
      li.appendChild(pie);
      ol.appendChild(li);
    });
    $('#vacio').hidden = resultado.citas.length > 0;
    $('#vacio').textContent = texto.value.trim()
      ? 'No encontramos citas de la Corte Constitucional ni de la Corte Suprema en este texto.'
      : 'Todavía no hay citas. Pega un texto o prueba con el ejemplo.';
    $('#copiar').disabled = resultado.citas.length === 0;
  }

  function actualizar() {
    var t = texto.value;
    var antes = resultado.citas.map(function (c) { return c.clave; }).join('|');
    resultado = C.buscar(t);
    var ahora = resultado.citas.map(function (c) { return c.clave; }).join('|');
    if (antes !== ahora) marcadas = [];
    pintarResumen();
    pintarTexto(t);
    pintarLista();
  }

  function copiar(textoCopiar, boton) {
    var hecho = function () {
      var antes = boton.textContent;
      boton.textContent = 'Copiada'; boton.classList.add('ok');
      setTimeout(function () { boton.textContent = antes; boton.classList.remove('ok'); }, 1500);
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(textoCopiar).then(hecho, function () { viejo(textoCopiar); hecho(); });
    } else { viejo(textoCopiar); hecho(); }
  }
  function viejo(t) {
    var a = document.createElement('textarea');
    a.value = t; a.setAttribute('readonly', ''); a.style.position = 'fixed'; a.style.opacity = '0';
    document.body.appendChild(a); a.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(a);
  }

  var espera = null;
  function iniciar() {
    texto.addEventListener('input', function () { clearTimeout(espera); espera = setTimeout(actualizar, 150); });
    $('#ejemplo').addEventListener('click', function () { texto.value = EJEMPLO; actualizar(); });
    $('#borrar').addEventListener('click', function () { texto.value = ''; actualizar(); texto.focus(); });
    $('#copiar').addEventListener('click', function (e) { copiar(C.lista(resultado, hoy(), marcadas), e.currentTarget); });
    actualizar();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
