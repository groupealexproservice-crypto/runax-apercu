/* Assistant RUNAX — répond uniquement à partir du contenu publié sur runax.ca. */
(function(){
  var KB=[
    {k:['formation','programme','cours','apprendre','module','pdf'],a:'Quatre formations en ligne, à suivre à votre rythme : Préparation 5 km (39 $), Préparation 10 km (59 $), Préparer un semi-marathon (79 $) et Technique de course (45 $), prix CA avant taxes, achat unique. Marathon, trail et ultra se préparent sur mesure avec une formule de coaching. <a href="formations.html">Voir les fiches</a>.'},
    {k:['coaching','coach perso','suivi','personnalis','plan mensuel','plan d'],a:'Trois formules, conçues, suivies et validées par un coach humain : Plan d’entraînement mensuel (89 $/mois), Coaching avec suivi avancé (159 $/mois) et Coaching personnalisé complet (249 $/mois), avant taxes. Aucun chrono n’est promis. <a href="coaching.html">Comparer les formules</a>.'},
    {k:['club','groupe','footing','sortie','communaut'],a:'Le RUNAX Club, c’est 19,98 $/mois avant taxes : une sortie footing encadrée d’environ 1 h par semaine, en groupe, à Montréal, tous niveaux. Le lieu et l’horaire sont communiqués aux inscrits. <a href="groupes.html">Découvrir le Club</a>.'},
    {k:['prix','tarif','combien','coût','cout','cher'],a:'Prix CA avant taxes — Formations : 39 $ à 79 $. Coaching : 89 $, 159 $ ou 249 $/mois. Club : 19,98 $/mois. Vêtements : de 24,99 $ (chaussettes) à 299,99 $ (veste de course) ; Pack athlète : 899,99 $. <a href="contact.html">Nous écrire</a>.'},
    {k:['alexandre','coach','fondateur','palmar','steeple','champion','qui'],a:'Alexandre, fondateur de RUNAX, est athlète international de steeple : deux participations aux Championnats du monde dont une finale, 5 fois champion de France, 20 fois champion de Tunisie, champion de la Méditerranée et finaliste aux championnats d’Afrique. <a href="coachs.html">Le coach</a>.'},
    {k:['disciplin','piste','route','trail','ultra','marathon','semi','5 km','10 km','800','1500','3000','5000','10000','distance'],a:'Piste (800 m, 1 500 m, 3 000 m, 3 000 m steeple, 5 000 m, 10 000 m), route (5 km, 10 km, semi-marathon, marathon) et trail (trail court à ultra-trail). <a href="disciplines.html">Voir les disciplines</a>.'},
    {k:['débutant','debutant','niveau','commencer','reprise'],a:'Oui, les débutants sont les bienvenus : le parcours « Début et reprise » de la Préparation 5 km part d’une alternance marche-course. Un avis médical est recommandé avant tout travail intense si vous présentez des symptômes ou une condition à risque. <a href="formations.html">Formations</a>.'},
    {k:['taille','tailles','size','s à xl','guide'],a:'Les vêtements RUNAX sont prévus du S au XL, en coupes Femme et Homme. Pour un conseil de taille, <a href="contact.html">écrivez-nous</a> avec votre taille habituelle.'},
    {k:['pack athl','huit','8 pièces'],a:'Le Pack athlète réunit huit pièces : chaussettes, t-shirt manches courtes et longues, veste à capuche, veste de survêtement, veste imperméable, sac et serviette. <a href="boutique.html#pack-athlete">Voir le pack</a>.'},
    {k:['vêtement','vetement','boutique','t-shirt','veste','pack','taille','commande','acheter'],a:'L’équipement RUNAX (Femme, Homme, accessoires et Pack athlète, tailles S à XL) est présenté dans la <a href="boutique.html">Boutique</a>. Pour commander, écrivez-nous avec la pièce, le coloris et la taille : nous confirmons la disponibilité et les modalités avant tout envoi. <a href="contact.html">Commander par message</a>.'},
    {k:['livraison','expédi','expedi','délai','delai','retour'],a:'Les formations et le coaching se font à distance, sans livraison physique : l’accès est envoyé par courriel. Pour les vêtements, les frais et délais de livraison au Canada sont indiqués au moment de la commande. Aide RUNAX <a href="contact.html">Écrivez-nous</a>.'},
    {k:['annul','rembours','engagement','résili','resili'],a:'Les conditions d’annulation et de remboursement sont communiquées par écrit avant tout engagement. Les formules de coaching sont mensuelles. <a href="assistance.html">Voir la FAQ</a>.'},
    {k:['paiement','payer','carte','inscri','réserver','reserver','appel','rendez'],a:'Pour l’instant, les inscriptions et commandes se font par message : envoyez votre demande par le <a href="contact.html">formulaire de contact</a> et nous vous répondons avec les modalités. Aucun paiement n’est demandé dans cet échange.'},
    {k:['contact','courriel','email','mail','joindre','écrire','ecrire','montréal','montreal'],a:'Écrivez-nous via le <a href="contact.html">formulaire de contact</a> ou à info@runax.ca. RUNAX est basée à Montréal.'},
    {k:['blessure','douleur','médical','medical','santé','sante'],a:'RUNAX applique un dépistage santé avant le travail intense et arrête la séance en cas de douleur thoracique, malaise ou vertige. Le coach n’établit aucun diagnostic : en cas de douleur persistante, consultez un professionnel de la santé.'}
  ];
  var CHIPS=['Formations','Coaching','Club','Prix','Le coach','Tailles','Livraison','Contact'];
  function norm(s){return (s||'').toLowerCase();}
  function answer(q){
    var n=norm(q),best=null,score=0;
    KB.forEach(function(e){var s=0;e.k.forEach(function(w){if(n.indexOf(w)>-1)s+=w.length;});if(s>score){score=s;best=e;}});
    return best?best.a:'Je n’ai pas cette information sur le site. Le plus simple est d’écrire au coach via le <a href="contact.html">formulaire de contact</a>.';
  }
  function el(t,c,h){var e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e;}
  function init(){
    if(document.querySelector('.rxa-btn'))return;
    var btn=el('button','rxa-btn','<i aria-hidden="true"></i>Aide RUNAX');btn.type='button';btn.setAttribute('aria-expanded','false');btn.setAttribute('aria-controls','rxa');
    var box=el('div','rxa');box.id='rxa';box.setAttribute('role','dialog');box.setAttribute('aria-label','Aide RUNAX · réponses tirées du site');
    box.innerHTML='<div class="rxa__head"><div><b>Aide RUNAX · réponses tirées du site</b><small>Réponses tirées du site. Pour un avis personnalisé, écrivez au coach.</small></div><button class="rxa__x" type="button" aria-label="Fermer">×</button></div><div class="rxa__log" aria-live="polite"></div><div class="rxa__chips"></div><form class="rxa__form"><label class="visually-hidden" for="rxa-q">Votre question</label><input id="rxa-q" type="text" autocomplete="off" placeholder="Votre question…"><button type="submit">Envoyer</button></form>';
    document.body.appendChild(btn);document.body.appendChild(box);
    var log=box.querySelector('.rxa__log'),chips=box.querySelector('.rxa__chips'),inp=box.querySelector('input');
    function say(h,me){var m=el('div','rxa__m'+(me?' rxa__m--me':''));if(me)m.textContent=h;else m.innerHTML=h;log.appendChild(m);log.scrollTop=log.scrollHeight;}
    function ask(q){if(!q)return;say(q,true);setTimeout(function(){say(answer(q));},180);}
    CHIPS.forEach(function(c){var b=el('button',null);b.type='button';b.textContent=c;b.onclick=function(){ask(c);};chips.appendChild(b);});
    say('Bonjour. Je réponds à vos questions sur les formations, le coaching, le Club et la boutique RUNAX.');
    function toggle(o){box.classList.toggle('is-open',o);btn.setAttribute('aria-expanded',o?'true':'false');if(o)inp.focus();}
    btn.onclick=function(){toggle(!box.classList.contains('is-open'));};
    box.querySelector('.rxa__x').onclick=function(){toggle(false);btn.focus();};
    box.querySelector('form').onsubmit=function(e){e.preventDefault();var q=inp.value.trim();inp.value='';ask(q);};
    document.addEventListener('keydown',function(e){if(e.key==='Escape'&&box.classList.contains('is-open')){toggle(false);btn.focus();}});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
