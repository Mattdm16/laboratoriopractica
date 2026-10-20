/* Sistema Gestión Documentos UNACH — Frontend jQuery + Backend PHP/MySQL */
$(function () {
  const API = {
    listar: 'api/listar.php',
    registrar: 'api/registrar.php',
    ver: 'api/ver.php',
    descargar: 'api/descargar.php',
    estatus: 'api/estatus.php',
    eliminar: 'api/eliminar.php'
  };

  let docs = [];
  let recientes = [];
  let currentId = null;

  function toast(msg) {
    const $t = $("#toast");
    $t.text(msg).addClass("show");
    clearTimeout($t.data("tm"));
    $t.data("tm", setTimeout(() => $t.removeClass("show"), 2600));
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function fmtFecha(iso) {
    if (!iso) return '—';
    const p = String(iso).slice(0, 10).split("-");
    return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : iso;
  }

  function badgeCls(e) {
    if (e === 'Recibido') return 'badge badge-rec';
    if (e === 'En proceso') return 'badge badge-proc';
    return 'badge badge-ate';
  }

  // ---- Carga desde servidor ----
  function cargar() {
    const params = {
      q: $("#q").val() || '',
      estatus: $("#fEstatus").val() || '',
      desde: $("#fDesde").val() || '',
      hasta: $("#fHasta").val() || ''
    };
    $.getJSON(API.listar, params)
      .done(function (res) {
        if (!res.ok) { toast('Error al cargar'); return; }
        docs = res.data || [];
        render(docs, res.counts || {});
      })
      .fail(function (xhr) {
        toast('No hay conexión con api/listar.php (' + xhr.status + '). Revisa XAMPP y db.sql.');
        render([], {});
      });
    cargarRecientes();
  }

  // Recientes de la barra lateral: SIEMPRE sin filtros
  function cargarRecientes() {
    $.getJSON(API.listar, {})
      .done(function (res) {
        if (!res.ok) return;
        recientes = (res.data || []).slice(0, 8);
        renderSide();
      })
      .fail(function () { /* si falla, conserva lo anterior */ });
  }

  function renderSide() {
    const $side = $("#sideDocList").empty();
    if (!recientes.length) {
      $side.append('<p class="muted side-empty">Sin documentos.</p>');
      return;
    }
    recientes.forEach(d => {
      $side.append(`<button type="button" class="side-doc" data-id="${d.id}" title="${esc(d.folio)} · ${esc(d.asunto)}">
        <span class="sd-ico">▤</span>
        <span class="sd-txt"><strong>${esc(d.asunto)}</strong><small>${esc(d.folio)} · ${fmtFecha(d.fecha)}</small></span>
      </button>`);
    });
  }

  function render(list, counts) {
    const $tb = $("#docsTable tbody").empty();
    const $mc = $("#mCards").empty();

    list.forEach(d => {
      const urlVer = API.ver + '?id=' + d.id;
      const urlDl = API.descargar + '?id=' + d.id;
      const opts = ['Recibido', 'En proceso', 'Atendido']
        .map(e => `<option ${e === d.estatus ? 'selected' : ''}>${e}</option>`).join('');
      $tb.append(`<tr data-id="${d.id}">
        <td><span class="folio">${esc(d.folio)}</span></td>
        <td class="cell-date">${fmtFecha(d.fecha)}</td>
        <td class="cell-asunto" title="${esc(d.asunto)}">${esc(d.asunto)}</td>
        <td class="cell-muted">${esc(d.remitente)}</td>
        <td class="cell-muted">${esc(d.destinatario)}</td>
        <td><span class="${badgeCls(d.estatus)}">${esc(d.estatus)}</span>
          <select class="est-sel" data-id="${d.id}">${opts}</select></td>
        <td><div class="row-acts">
          <a class="act" href="${urlVer}" target="_blank" rel="noopener">Ver</a>
          <a class="act" href="${urlDl}">PDF</a>
          <button type="button" class="act danger" data-del="${d.id}">Eliminar</button>
        </div></td></tr>`);
      $mc.append(`<div class="m-card" data-id="${d.id}">
        <div class="row"><strong class="folio">${esc(d.folio)}</strong><span class="${badgeCls(d.estatus)}">${esc(d.estatus)}</span></div>
        <h3>${esc(d.asunto)}</h3><p>${esc(d.remitente)} → ${esc(d.destinatario)}<br>${fmtFecha(d.fecha)}</p>
        <div class="m-actions"><button data-act="ver">Ver</button><button data-act="descargar">Descargar</button><button data-act="eliminar">Eliminar</button></div>
      </div>`);
    });

    const empty = !list.length;
    $("#docEmpty").prop("hidden", !empty);
    $(".table-wrap").prop("hidden", empty);

    const n = list.length;
    $("#tableFoot").text(n === 1 ? '1 documento — ordenado por fecha (más reciente primero)' : `${n} documentos — ordenados por fecha (más reciente primero)`);
    $("#stRec").text(counts.recibido || 0);
    $("#stProc").text(counts.proceso || 0);
    $("#stAte").text(counts.atendido || 0);

    // Mantiene selección válida
    if (currentId) {
      const still = list.find(x => x.id == currentId);
      if (!still) currentId = null;
    }
  }

  function openVisor(id) {
    const d = docs.find(x => x.id == id);
    if (!d) { toast('Documento no encontrado.'); return; }
    currentId = d.id;
    $("#visorTitle").text(d.asunto);
    $("#visorDescargar").attr("href", API.descargar + '?id=' + d.id);
    if (d.archivo && /\.(jpe?g|png)$/i.test(d.archivo)) {
      $("#visorFrame").prop("hidden", true);
      $("#visorImg").prop("hidden", false).attr("src", API.ver + '?id=' + d.id);
    } else {
      $("#visorImg").prop("hidden", true);
      $("#visorFrame").prop("hidden", false).attr("src", API.ver + '?id=' + d.id);
    }
    openModal("modalVisor");
  }

  function eliminarDoc(id) {
    const d = docs.find(x => x.id == id);
    if (!d) return;
    if (!confirm(`¿Eliminar ${d.folio} — ${d.asunto}? También borra el archivo.`)) return;
    $.ajax({ url: API.eliminar, type: 'POST', data: JSON.stringify({ id: d.id }), contentType: 'application/json', dataType: 'json' })
      .done(function (res) { if (res.ok) { toast('Eliminado.'); if (currentId == d.id) currentId = null; cargar(); } else toast(res.error || 'Error'); })
      .fail(() => toast('Error al eliminar.'));
  }

  const VIEWS = ["documentos", "nuevo"];

  function go(view) {
    if (!VIEWS.includes(view)) view = "documentos";
    $(".nav-item").removeClass("active");
    if (view === "nuevo") $('.nav-item[data-action="nuevo"]').addClass("active");
    else $('.nav-item[data-view="documentos"]').addClass("active");
    VIEWS.forEach(v => $("#view-" + v).prop("hidden", v !== view));
    $("#topTitle").text(view === "nuevo" ? "Nuevo documento" : "Gestión de Documentos");
    $(".main").scrollTop(0);
  }

  function openModal(id) { $("#" + id).prop("hidden", false); }
  function closeModal(id) { $("#" + id).prop("hidden", true); }

  // ---- Navegación ----
  $(document).on("click", "[data-view]", function () { go($(this).data("view")); });
  $(document).on("click", "[data-view-go]", function () { go($(this).data("view-go")); });
  $(document).on("click", "[data-close]", function () { closeModal($(this).data("close")); });
  $(".modal").on("click", function (e) { if (e.target === this) $(this).prop("hidden", true); });

  // ---- Filtros Documentos (muestra todo por defecto) ----
  let t = null;
  $("#q").on("input", function () {
    if (!$("#view-nuevo").prop("hidden")) go("documentos");
    clearTimeout(t); t = setTimeout(cargar, 350);
  });
  $("#fEstatus, #fDesde, #fHasta").on("change", cargar);

  // ---- Atajos: ESC cierra modal / sale de Nuevo; Enter busca ya ----
  $(document).on("keydown", function (e) {
    if (e.key === "Enter" && document.activeElement && document.activeElement.id === "q") {
      e.preventDefault();
      clearTimeout(t); cargar();
      return;
    }
    if (e.key === "Escape") {
      const $open = $(".modal").filter(function () { return !this.hidden; });
      if ($open.length) { $open.prop("hidden", true); return; }
      if (!$("#view-nuevo").prop("hidden")) go("documentos");
    }
  });

  // ---- Clic en fila/card/lista del sidebar abre visor ----
  $(document).on("click", "#docsTable tbody tr, .m-card, .side-doc", function (e) {
    const $ctl = $(e.target).closest("button,a,select,input");
    if ($ctl.length && !$ctl.is(this)) return;
    const id = $(this).data("id");
    if (id) openVisor(id);
  });

  // ---- Registro: asistente por pasos ----
  function wizReset() {
    $("#formRegistro")[0].reset();
    $("#fileName").text("Ningún archivo seleccionado");
    $("#filePreview").empty();
    $("#dropZone").removeClass("ok");
    $('#formRegistro [name]').each(function () {
      $(this).closest("label").removeClass("invalid");
      $(this).siblings(".field-err").prop("hidden", true);
    });
    // fecha de hoy por defecto, sin permitir fecha futura
    const hoy = new Date().toISOString().slice(0, 10);
    $('#formRegistro [name="fecha"]').attr("max", hoy).val(hoy);
    wizShow(1);
  }
  function wizShow(n) {
    $('#view-nuevo [data-pane]').each(function () {
      $(this).prop("hidden", $(this).data("pane") != n);
    });
    $("#view-nuevo .step").each(function () {
      const s = $(this).data("step");
      $(this).toggleClass("on", s == n).toggleClass("done", s < n);
      if (s < n) $(this).find(".n").text("✓");
      else $(this).find(".n").text(s);
    });
    $('#view-nuevo [data-line]').each(function () {
      $(this).toggleClass("done", $(this).data("line") < n);
    });
    $(".main").scrollTop(0);
  }
  $(document).on("click", '[data-action="nuevo"]', () => { wizReset(); go("nuevo"); });

  // Paso 1: validar datos (límites y campos obligatorios; no avanza si falla)
  const FIELD_MAX = { no_oficio: 16, remitente: 20, destinatario: 20, asunto: 255 };

  function wizValidPane1() {
    let ok = true;
    let first = null;
    const hoy = new Date().toISOString().slice(0, 10);

    $('#formRegistro [data-pane="1"] [required]').each(function () {
      const $l = $(this).closest("label");
      const name = $(this).attr("name");
      const v = ($(this).val() || "").trim();
      let msg = "";

      if (!v) {
        msg = name === "fecha" ? "La fecha es obligatoria." : "Este campo es obligatorio.";
      } else if (FIELD_MAX[name] && v.length > FIELD_MAX[name]) {
        msg = `Máximo ${FIELD_MAX[name]} caracteres (vas por ${v.length}).`;
      } else if (name === "fecha") {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(v) || isNaN(new Date(v + "T00:00:00").getTime())) {
          msg = "Fecha inválida.";
        } else if (v > hoy) {
          msg = "La fecha no puede ser futura.";
        }
      }

      $l.toggleClass("invalid", !!msg);
      $l.find(".field-err").text(msg).prop("hidden", !msg);
      if (msg) { ok = false; first = first || this; }
    });

    if (first) first.focus();
    return ok;
  }
  // Paso 1 → 2: valida datos y que el folio NO esté repetido
  $("#btnNext1").on("click", function () {
    if (!wizValidPane1()) return;
    const folio = ($('#formRegistro [name="no_oficio"]').val() || '').trim();
    const $btn = $(this);
    const $folio = $('#formRegistro [name="no_oficio"]');
    const $l = $folio.closest("label");

    $btn.prop("disabled", true).text("Verificando folio…");
    $.getJSON(API.listar, { q: folio })
      .done(function (res) {
        const dup = (res.data || []).some(d => String(d.folio || '').trim() === folio);
        if (dup) {
          $l.addClass("invalid");
          $l.find(".field-err").text("El folio " + folio + " ya está registrado. Usa uno distinto.").prop("hidden", false);
          $folio.focus();
          toast("Ese No. de oficio ya existe.");
        } else {
          wizShow(2);
        }
      })
      .fail(function () {
        // Sin API: se avanza; el servidor rechaza el duplicado al confirmar
        toast("No se pudo verificar el folio ahora; se comprobará al guardar.");
        wizShow(2);
      })
      .always(function () { $btn.prop("disabled", false).text("Siguiente →"); });
  });
  $("#btnBack2").on("click", () => wizShow(1));
  // Limpia el error del campo en cuanto se corrige
  $('#formRegistro [data-pane="1"] input').on("input change", function () {
    const $l = $(this).closest("label");
    if (!$l.hasClass("invalid")) return;
    const v = ($(this).val() || "").trim();
    const name = $(this).attr("name");
    const hoy = new Date().toISOString().slice(0, 10);
    const maxOk = !(FIELD_MAX[name] && v.length > FIELD_MAX[name]);
    const fechaOk = name !== "fecha" || (!!v && v <= hoy);
    if (v && maxOk && fechaOk) {
      $l.removeClass("invalid");
      $l.find(".field-err").prop("hidden", true);
    }
  });
  $("#formRegistro").on("keydown", function (e) {
    if (e.key === "Enter" && !$('[data-pane="1"]').prop("hidden")) { e.preventDefault(); $("#btnNext1").click(); }
  });

  // Paso 2: archivo + vista previa
  function wizFile() {
    return $("#regArchivo")[0].files[0] || $("#regFoto")[0].files[0] || null;
  }
  function wizPreview(f) {
    const $p = $("#filePreview").empty();
    if (!f) return;
    if (/^image\//.test(f.type)) {
      const r = new FileReader();
      r.onload = e => $p.html(`<img src="${e.target.result}" alt="Vista previa" />`);
      r.readAsDataURL(f);
    } else {
      $p.html(`<div class="filerow">📄 <strong>${esc(f.name)}</strong><span class="muted">· ${(f.size / 1048576).toFixed(2)} MB</span></div>`);
    }
  }
  $("#btnFoto").on("click", () => $("#regFoto").click());
  $("#btnPdf").on("click", () => $("#regArchivo").click());
  $("#regFoto").on("change", function () {
    if (this.files[0]) { $("#regArchivo").val(""); updFileUI(this.files[0]); }
  });
  $("#regArchivo").on("change", function () {
    if (this.files[0]) { $("#regFoto").val(""); updFileUI(this.files[0]); }
  });
  function updFileUI(f) {
    $("#fileName").text(`${f.name} · ${(f.size / 1048576).toFixed(2)} MB — listo ✓`);
    $("#dropZone").addClass("ok");
    wizPreview(f);
  }

  // Paso 2 → 3: exige archivo y arma el resumen de verificación
  $("#btnNext2").on("click", function () {
    const f = wizFile();
    if (!f) { toast('Selecciona PDF o toma foto para continuar.'); return; }
    if (f.size > 10 * 1024 * 1024) { toast('Archivo excede 10 MB.'); return; }
    wizFillReview();
    wizShow(3);
  });

  function wizFillReview() {
    const g = n => ($('#formRegistro [name="' + n + '"]').val() || '').trim();
    $("#rvFolio").text(g("no_oficio") || "—");
    $("#rvFecha").text(fmtFecha(g("fecha")));
    $("#rvAsunto").text(g("asunto") || "—");
    $("#rvRemitente").text(g("remitente") || "—");
    $("#rvDestinatario").text(g("destinatario") || "—");
    $("#rvEstatus").text(g("estatus") || "—");
    const f = wizFile();
    $("#rvArchivo").text(f ? f.name + " · " + (f.size / 1048576).toFixed(2) + " MB" : "—");

    const $p = $("#rvPreview").empty();
    if (f && /^image\//.test(f.type)) {
      const r = new FileReader();
      r.onload = e => $p.html('<img src="' + e.target.result + '" alt="Vista previa del archivo" />');
      r.readAsDataURL(f);
    } else if (f) {
      $p.html('<div class="filerow">📄 <strong>' + esc(f.name) + '</strong><span class="muted">· ' + (f.size / 1048576).toFixed(2) + ' MB</span></div>');
    }
  }

  $("#btnEdit1").on("click", () => wizShow(1));

  // Paso 3 → 4: confirmar sube el registro al servidor
  $("#btnConfirmar").on("click", enviarRegistro);

  function enviarRegistro() {
    const fd = new FormData($("#formRegistro")[0]);
    const foto = $("#regFoto")[0].files[0];
    if (foto && !$("#regArchivo")[0].files[0]) { fd.delete('archivo'); fd.append('archivo', foto, foto.name || 'foto.jpg'); }
    const f = fd.get('archivo');
    if (!f || !f.name) { toast('Selecciona PDF o toma foto para continuar.'); return; }
    if (f.size > 10 * 1024 * 1024) { toast('Archivo excede 10 MB.'); return; }

    $("#btnConfirmar").prop("disabled", true).text("Subiendo…");
    $.ajax({ url: API.registrar, type: 'POST', data: fd, processData: false, contentType: false, dataType: 'json' })
      .done(function (res) {
        if (!res.ok) { toast(res.error || 'Error al registrar'); return; }
        wizVerify(res.id, fd.get('no_oficio'));
      })
      .fail(function (xhr) {
        let msg = 'Error al registrar';
        try { msg = JSON.parse(xhr.responseText).error || msg; } catch (_) {}
        toast(msg + ' (' + xhr.status + ')');
      })
      .always(function () { $("#btnConfirmar").prop("disabled", false).text("Confirmar y guardar →"); });
  }

  // Paso 4: confirmación — verifica que la subida quedó en el servidor
  function wizVerify(id, folio) {
    $("#v3Title").text("Verificando subida…");
    $("#v3Msg").text("Comprobando que el documento y su archivo quedaron guardados.");
    $("#v3Check").text("…");
    wizShow(4);
    cargar();
    $.getJSON(API.listar, { q: folio })
      .done(function (res) {
        const d = (res.data || []).find(x => x.id == id || x.folio === folio);
        if (d && d.archivo) {
          $("#v3Check").text("✓");
          $("#v3Title").text("¡Registro exitoso!");
          $("#v3Msg").text(`El documento ${d.folio} se guardó y su archivo fue verificado en el servidor.`);
          $("#v3Folio").text(d.folio);
          $("#v3Asunto").text(d.asunto);
          $("#v3Partes").text(`${d.remitente} → ${d.destinatario}`);
          $("#v3File").text(String(d.archivo).split('/').pop() + " — verificado ✓");
          $("#v3Ver").attr("href", API.ver + '?id=' + d.id).show();
          const i = docs.findIndex(x => x.id == d.id);
          if (i < 0) docs.push(d); else docs[i] = d;
          currentId = d.id;
        } else {
          $("#v3Check").text("!");
          $("#v3Title").text("Registrado, sin verificación");
          $("#v3Msg").text("Se guardó el registro pero no se pudo confirmar el archivo. Revisa el listado.");
          $("#v3Ver").hide();
        }
      })
      .fail(function () {
        $("#v3Check").text("!");
        $("#v3Title").text("Registrado, sin verificación");
        $("#v3Msg").text("Sin conexión para verificar. Revisa el listado de documentos.");
        $("#v3Ver").hide();
      });
  }
  $("#btnOtro").on("click", () => { wizReset(); });

  // ---- Ver / Descargar / Eliminar / Estatus (sin panel detalle) ----
  $(document).on("click", '.m-actions button', function () {
    const id = $(this).closest('.m-card').data('id');
    const act = $(this).data("act");
    if (act === "ver") openVisor(id);
    else if (act === "descargar") window.location.href = API.descargar + '?id=' + id;
    else if (act === "eliminar") eliminarDoc(id);
  });
  $(document).on("click", "[data-del]", function (e) {
    e.stopPropagation();
    eliminarDoc($(this).data("del"));
  });
  $(document).on("change", ".est-sel", function (e) {
    e.stopPropagation();
    const id = $(this).data("id");
    const est = $(this).val();
    $.ajax({ url: API.estatus, type: 'POST', data: JSON.stringify({ id: id, estatus: est }), contentType: 'application/json', dataType: 'json' })
      .done(function (res) { if (res.ok) { toast('Estatus: ' + est); cargar(); } else toast(res.error || 'Error'); })
      .fail(() => toast('Error al cambiar estatus.'));
  });

  cargar();
});
