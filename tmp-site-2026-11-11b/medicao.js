/* Medição de contatos — gschimmel.com.br
   1) Conta cliques em WhatsApp e telefone como conversão no Google Ads.
   2) Marca a mensagem do WhatsApp quando o visitante veio de anúncio do Google,
      com um código curto (Ref. G-XXXXX), e registra esse código com o identificador
      do clique em /registro.php, para lançar os contratos fechados como conversão.
   Preencha ADS_ID e ROTULO_* depois de criar as ações de conversão no Google Ads. */
(function () {
  var ADS_ID = 'AW-18563819187';
  var ROTULO_WHATSAPP = 'YJDACM75zLQdELPN9ZNF';
  var ROTULO_TELEFONE = '';

  // Origem: guarda por 30 dias se a visita veio de anúncio do Google,
  // com o identificador do clique (gclid/gbraid/wbraid) e um código curto de referência.
  var p = new URLSearchParams(location.search);
  var veioDoAnuncio = p.has('gclid') || p.has('gbraid') || p.has('wbraid') || p.get('utm_source') === 'google';
  var origem = null;
  function novoCodigo() {
    var c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', r = 'G-';
    for (var i = 0; i < 5; i++) r += c.charAt(Math.floor(Math.random() * c.length));
    return r;
  }
  try {
    var salvo = JSON.parse(localStorage.getItem('gs_origem') || 'null');
    if (salvo && Date.now() - salvo.t > 30 * 864e5) salvo = null;
    if (veioDoAnuncio) {
      origem = {
        o: 'google', t: Date.now(),
        ref: (salvo && salvo.ref) || novoCodigo(),
        gclid: p.get('gclid') || (salvo && salvo.gclid) || '',
        gbraid: p.get('gbraid') || (salvo && salvo.gbraid) || '',
        wbraid: p.get('wbraid') || (salvo && salvo.wbraid) || ''
      };
      localStorage.setItem('gs_origem', JSON.stringify(origem));
    } else if (salvo) {
      origem = salvo;
    }
  } catch (e) {}
  if (origem && !origem.ref) origem.ref = novoCodigo();
  veioDoAnuncio = !!origem;

  if (veioDoAnuncio) {
    var sufixo = encodeURIComponent(' (Ref. ' + origem.ref + ')');
    document.querySelectorAll('a[href*="wa.me/"]').forEach(function (a) {
      var h = a.href.indexOf('vim%20pelo%20site') > -1
        ? a.href.replace('vim%20pelo%20site', 'vim%20pelo%20Google')
        : a.href.indexOf('text=') > -1
          ? a.href.replace('text=', 'text=' + encodeURIComponent('[Google] '))
          : a.href + '?text=' + encodeURIComponent('Olá, vim pelo Google e gostaria de orientação.');
      a.href = h + sufixo;
    });
    // Registra o código com o identificador do clique, para lançar contratos fechados no Google Ads
    document.addEventListener('click', function (ev) {
      var a = ev.target.closest && ev.target.closest('a[href*="wa.me/"]');
      if (!a || !navigator.sendBeacon) return;
      var f = new FormData();
      f.append('ref', origem.ref); f.append('gclid', origem.gclid || '');
      f.append('gbraid', origem.gbraid || ''); f.append('wbraid', origem.wbraid || '');
      f.append('pagina', location.pathname);
      navigator.sendBeacon('/registro.php', f);
    }, true);
  }

  if (!ADS_ID) return;

  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + ADS_ID;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { dataLayer.push(arguments); };
  gtag('js', new Date());
  gtag('config', ADS_ID);

  function converter(rotulo) {
    if (rotulo) gtag('event', 'conversion', { send_to: ADS_ID + '/' + rotulo, transport_type: 'beacon' });
  }
  document.addEventListener('click', function (ev) {
    var a = ev.target.closest && ev.target.closest('a[href]');
    if (!a) return;
    if (a.href.indexOf('wa.me/') > -1) converter(ROTULO_WHATSAPP);
    else if (a.href.indexOf('tel:') === 0) converter(ROTULO_TELEFONE);
  }, true);
})();
