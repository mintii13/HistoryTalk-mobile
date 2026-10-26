import { BG, CARD, ORANGE, TEXT } from '@/constants/palette';
import { MAP_BOUNDS, STUDY_NOTE_COLOR } from '@/features/map/types';

// Ranh giới quốc gia + tỉnh (từ HistoryTalk-FE public/data, đã làm tròn toạ độ)
const vietnamAdm0 = require('@/assets/data/vietnam-adm0.json');
const vietnamAdm1 = require('@/assets/data/vietnam-adm1.json');

/**
 * Trang Leaflet chạy trong WebView — dựng lại nền bản đồ của web (LeafletMap.tsx):
 * tile Esri không nhãn, ranh giới Việt Nam, tỉnh (hiện tên khi zoom), Hoàng Sa,
 * Trường Sa, nhãn vùng — mọi nhãn đều tiếng Việt do app tự vẽ.
 *
 * RN → trang: `window.HT.<lệnh>(...)` qua injectJavaScript.
 * Trang → RN: postMessage JSON `{ type: 'ready' | 'battle' | 'note' | 'mapClick', ... }`.
 */

const LEAFLET_VERSION = '1.9.4';

const SCRIPT = String.raw`
(function () {
  var post = function (msg) { window.ReactNativeWebView.postMessage(JSON.stringify(msg)); };
  // Màn dọc của điện thoại: vừa khít đất liền Việt Nam thay vì khung ngang của web
  var MAINLAND = L.latLngBounds([8.4, 102.1], [23.4, 109.6]);
  var LABEL_MIN_ZOOM = 6;
  var bounds = L.latLngBounds(L.latLng(B.south, B.west), L.latLng(B.north, B.east));
  var map = L.map('map', {
    zoomSnap: 0.25, zoomDelta: 0.5,
    minZoom: 5.5, maxZoom: 11, maxBounds: bounds, maxBoundsViscosity: 1.0,
    bounceAtZoomLimits: false, zoomControl: false, attributionControl: true, preferCanvas: true,
  });
  map.fitBounds(MAINLAND);
  map.attributionControl.setPrefix('<a href="https://leafletjs.com">Leaflet</a>');

  var esc = function (v) {
    return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  };

  // ── Nền bản đồ ──
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 16, attribution: 'Nền bản đồ &copy; Esri, &copy; OpenStreetMap contributors',
  }).addTo(map);
  L.geoJSON(ADM0, { interactive: false, style: { color: '#B8321F', weight: 3, opacity: 0.95, fillColor: '#F5F2EA', fillOpacity: 0.3 } }).addTo(map);
  L.geoJSON(ADM1, {
    interactive: false,
    style: { color: '#111111', weight: 0.8, opacity: 0.32, fillOpacity: 0 },
    onEachFeature: function (feature, layer) {
      var name = feature.properties && feature.properties.shapeName;
      if (!name || !layer.getBounds) return;
      L.marker(layer.getBounds().getCenter(), {
        interactive: false,
        icon: L.divIcon({ className: 'province-wrap', html: '<div class="province">' + esc(name) + '</div>', iconSize: [92, 28], iconAnchor: [46, 14] }),
      }).addTo(map);
    },
  }).addTo(map);
  var line = { color: '#111111', dashArray: '6 8', opacity: 0.42, weight: 1.4, interactive: false };
  L.polyline([[16.2, 108.2], [16.45, 110.0], [16.55, 111.6], [16.35, 112.45]], line).addTo(map);
  L.polyline([[11.0, 109.0], [10.45, 111.4], [10.05, 113.0], [9.65, 114.35]], line).addTo(map);
  var islands = [[16.83, 112.34], [16.58, 111.72], [16.44, 112.72], [15.92, 111.95], [15.76, 112.55], [16.18, 113.05],
    [11.45, 114.35], [10.88, 114.9], [10.35, 113.75], [9.78, 114.42], [9.2, 113.2], [8.65, 114.05], [8.95, 112.62], [10.02, 115.32]];
  islands.forEach(function (p) {
    L.circleMarker(p, { radius: 4, color: '#111111', weight: 1.4, fillColor: '#B8321F', fillOpacity: 0.92, interactive: false }).addTo(map);
  });
  var label = function (pos, text, cls) {
    L.marker(pos, { interactive: false, icon: L.divIcon({ className: 'label-wrap', html: '<div class="label ' + (cls || '') + '">' + text + '</div>', iconSize: [120, 28], iconAnchor: [60, 14] }) }).addTo(map);
  };
  label([16.6, 106.4], 'Việt Nam', 'country');
  label([21.1, 105.7], 'Bắc Bộ', 'region');
  label([16.2, 107.7], 'Trung Bộ', 'region');
  label([10.4, 106.1], 'Nam Bộ', 'region');
  label([17.05, 112.95], 'Hoàng Sa');
  label([10.85, 114.75], 'Trường Sa');
  label([13.5, 112.1], 'Biển Đông', 'sea');

  // Marker to/nhỏ theo zoom, tên tỉnh chỉ hiện khi zoom đủ gần
  var root = document.getElementById('map');
  var onZoom = function () {
    var z = map.getZoom();
    root.style.setProperty('--marker-scale', String(Math.max(0.55, Math.min(1.4, (z - 4) / 5))));
    root.classList.toggle('show-provinces', z >= 6.75);
  };
  map.on('zoom zoomend', onZoom);
  onZoom();

  // ── Lớp dữ liệu ──
  var state = { battles: [], notes: [], selectedBattle: null, selectedNote: null, placing: false };
  var battleMarkers = {};
  var noteMarkers = {};
  var draftLayer = null;

  var battleIcon = function (b, selected) {
    var photo = b.imageUrl
      ? '<img src="' + esc(b.imageUrl) + '" alt="" onerror="this.remove()" />'
      : '';
    return L.divIcon({
      className: 'battle-wrap',
      html: '<div class="battle' + (selected ? ' selected' : '') + '"><div class="photo">' + photo + '<span>⚔</span></div>' +
        '<span class="year">' + esc(b.yearLabel) + '</span><span class="name">' + esc(b.title) + '</span></div>',
      iconSize: [60, 60], iconAnchor: [30, 30],
    });
  };
  var noteIcon = function (selected) {
    return L.divIcon({
      className: 'note-wrap',
      html: '<div class="note' + (selected ? ' selected' : '') + '"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg></div>',
      iconSize: [28, 34], iconAnchor: [14, 34],
    });
  };

  // Tên trận chồng nhau khi zoom xa: giữ tên trận đang chọn, còn lại ai đến trước giữ
  var layoutLabels = function () {
    var zoom = map.getZoom();
    var pins = Array.prototype.slice.call(root.querySelectorAll('.battle'))
      .sort(function (a, b) { return Number(b.classList.contains('selected')) - Number(a.classList.contains('selected')); });
    var placed = [];
    pins.forEach(function (pin) {
      var name = pin.querySelector('.name');
      if (!name) return;
      var selected = pin.classList.contains('selected');
      if (!selected && zoom < LABEL_MIN_ZOOM) { pin.classList.add('label-hidden'); return; }
      pin.classList.remove('label-hidden');
      var r = name.getBoundingClientRect();
      var hit = placed.some(function (p) { return r.left < p.right + 4 && r.right + 4 > p.left && r.top < p.bottom + 2 && r.bottom + 2 > p.top; });
      pin.classList.toggle('label-hidden', hit && !selected);
      if (!hit || selected) placed.push(r);
    });
  };
  var labelTimer;
  var scheduleLabels = function () { clearTimeout(labelTimer); labelTimer = setTimeout(layoutLabels, 280); };
  map.on('zoomend', scheduleLabels);

  var syncBattles = function () {
    var ids = {};
    state.battles.forEach(function (b) {
      ids[b.id] = true;
      var selected = b.id === state.selectedBattle;
      var m = battleMarkers[b.id];
      if (m) { m.setIcon(battleIcon(b, selected)).setLatLng([b.lat, b.lng]); }
      else {
        m = L.marker([b.lat, b.lng], { icon: battleIcon(b, selected), zIndexOffset: 1000, bubblingMouseEvents: false });
        m.on('click', function () { if (!state.placing) post({ type: 'battle', id: b.id }); });
        m.addTo(map);
        battleMarkers[b.id] = m;
      }
      m.setZIndexOffset(selected ? 2000 : 1000);
    });
    Object.keys(battleMarkers).forEach(function (id) {
      if (!ids[id]) { map.removeLayer(battleMarkers[id]); delete battleMarkers[id]; }
    });
    scheduleLabels();
  };
  var syncNotes = function () {
    var ids = {};
    state.notes.forEach(function (n) {
      ids[n.id] = true;
      var selected = n.id === state.selectedNote;
      var m = noteMarkers[n.id];
      if (m) { m.setIcon(noteIcon(selected)).setLatLng([n.lat, n.lng]); }
      else {
        m = L.marker([n.lat, n.lng], { icon: noteIcon(selected), zIndexOffset: 600, bubblingMouseEvents: false });
        m.on('click', function () { if (!state.placing) post({ type: 'note', id: n.id }); });
        m.addTo(map);
        noteMarkers[n.id] = m;
      }
      m.setZIndexOffset(selected ? 1500 : 600);
    });
    Object.keys(noteMarkers).forEach(function (id) {
      if (!ids[id]) { map.removeLayer(noteMarkers[id]); delete noteMarkers[id]; }
    });
  };

  var shifted = function (latlng, zoom, cover) {
    if (!cover) return latlng;
    var p = map.project(latlng, zoom).add([0, (map.getSize().y * cover) / 2]);
    return map.unproject(p, zoom);
  };

  map.on('click', function (e) { post({ type: 'mapClick', lat: e.latlng.lat, lng: e.latlng.lng }); });

  window.HT = {
    setBattles: function (list) { state.battles = list; syncBattles(); },
    setNotes: function (list) { state.notes = list; syncNotes(); },
    setSelected: function (battleId, noteId) {
      state.selectedBattle = battleId; state.selectedNote = noteId; syncBattles(); syncNotes();
    },
    setPlacing: function (on) { state.placing = on; root.classList.toggle('placing', on); },
    setDraft: function (d) {
      if (draftLayer) { map.removeLayer(draftLayer); draftLayer = null; }
      if (!d) return;
      draftLayer = L.layerGroup().addTo(map);
      L.circleMarker([d.lat, d.lng], { radius: 18, color: '#ffffff', weight: 2, fillColor: NOTE, fillOpacity: 0.2, interactive: false }).addTo(draftLayer);
      L.circleMarker([d.lat, d.lng], { radius: 8, color: '#ffffff', weight: 3, fillColor: NOTE, fillOpacity: 1, interactive: false })
        .bindTooltip('Ghi chú · Chưa lưu', { permanent: true, direction: 'top', offset: [0, -20], opacity: 1 }).addTo(draftLayer);
    },
    // cover = phần chiều cao bản đồ bị bảng thông tin che từ dưới lên (0–1):
    // dời tâm xuống để điểm đến nằm giữa phần bản đồ còn nhìn thấy
    flyTo: function (lat, lng, zoom, cover) {
      map.stop(); map.flyTo(shifted([lat, lng], zoom, cover), zoom, { duration: 1.0 });
    },
    focusPoint: function (lat, lng, cover) {
      var zoom = Math.max(map.getZoom(), 8);
      map.stop(); map.flyTo(shifted([lat, lng], zoom, cover), zoom, { duration: 0.9 });
    },
    resetView: function () { map.stop(); map.flyToBounds(MAINLAND, { duration: 1.0 }); },
    zoomIn: function () { map.zoomIn(); },
    zoomOut: function () { map.zoomOut(); },
  };
  post({ type: 'ready' });
})();
`;

const CSS = `
html, body, #map { margin: 0; padding: 0; width: 100%; height: 100%; background: ${BG}; }
body { font-family: -apple-system, Roboto, "Segoe UI", sans-serif; -webkit-tap-highlight-color: transparent; }
.leaflet-container { background: ${BG}; }
.leaflet-control-attribution { font-size: 9px; }
.label-wrap, .province-wrap, .battle-wrap, .note-wrap { background: none; border: 0; }
.label { color: #111; font-size: 13px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; white-space: nowrap; text-align: center;
  text-shadow: 0 1px 0 rgba(245,242,234,.9), 0 0 6px rgba(245,242,234,.7); }
.label.country { color: #9A2A18; font-size: 20px; letter-spacing: .12em; }
.label.region { color: rgba(17,17,17,.46); font-size: 12px; font-weight: 700; letter-spacing: .12em; }
.label.sea { color: rgba(17,17,17,.5); font-size: 14px; font-weight: 700; letter-spacing: .14em; }
.province { color: rgba(17,17,17,.72); font-size: 10px; font-weight: 700; line-height: 1.05; max-width: 92px; text-align: center;
  text-shadow: 0 1px 0 rgba(245,242,234,.95), 0 -1px 0 rgba(245,242,234,.72), 1px 0 0 rgba(245,242,234,.72), -1px 0 0 rgba(245,242,234,.72); }
.province-wrap { opacity: 0; transition: opacity 180ms ease; }
#map.show-provinces .province-wrap { opacity: 1; }
.battle { position: relative; width: 60px; height: 60px; transform: scale(var(--marker-scale, .65)); transform-origin: center bottom; }
.battle .photo { position: relative; width: 60px; height: 60px; box-sizing: border-box; border: 3px solid ${ORANGE}; border-radius: 50%; overflow: hidden;
  background: ${CARD}; display: grid; place-items: center; }
.battle .photo span { color: ${ORANGE}; font-size: 24px; }
.battle .photo img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.battle.selected .photo { border-color: ${CARD}; outline: 3px solid ${ORANGE}; }
.battle .year { position: absolute; bottom: -7px; left: 50%; transform: translateX(-50%); padding: 1px 7px; border-radius: 2px; background: ${ORANGE};
  color: #fff; font-size: 11px; line-height: 18px; font-weight: 700; letter-spacing: .06em; white-space: nowrap; }
.battle .name { position: absolute; top: 76px; left: 50%; transform: translateX(-50%); max-width: 210px; width: max-content; padding: 5px 9px;
  border: 1px solid ${TEXT}; border-radius: 2px; background: ${CARD}; color: ${TEXT}; font-size: 12px; line-height: 16px; font-weight: 700; text-align: center; }
.battle.selected .name { background: ${TEXT}; border-color: ${TEXT}; color: ${CARD}; }
.battle.label-hidden .name { visibility: hidden; }
.note { position: relative; display: grid; place-items: center; width: 28px; height: 28px; box-sizing: border-box; border: 1.5px solid ${TEXT};
  border-radius: 2px; background: ${STUDY_NOTE_COLOR}; color: #fff; }
.note::after { content: ""; position: absolute; left: 50%; bottom: -7px; width: 1.5px; height: 6px; background: ${TEXT}; transform: translateX(-50%); }
.note.selected { outline: 2px solid ${STUDY_NOTE_COLOR}; outline-offset: 2px; transform: translateY(-2px); }
#map.placing .leaflet-marker-icon { pointer-events: none; }
`;

export const LEAFLET_HTML = `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.css" />
<style>${CSS}</style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.js"></script>
<script>
var B = ${JSON.stringify(MAP_BOUNDS)};
var NOTE = ${JSON.stringify(STUDY_NOTE_COLOR)};
var ADM0 = ${JSON.stringify(vietnamAdm0)};
var ADM1 = ${JSON.stringify(vietnamAdm1)};
${SCRIPT}
</script>
</body>
</html>`;
