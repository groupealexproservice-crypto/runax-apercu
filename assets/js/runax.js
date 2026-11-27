/* Libellé provisoire commun des boutons d’achat (classe .btn-achat). Laisser vide pour garder le texte HTML. Aucun panier ni paiement n’est simulé. */
var RUNAX_LIBELLE_ACHAT='';
if(RUNAX_LIBELLE_ACHAT){document.querySelectorAll('.btn-achat').forEach(function(b){b.textContent=RUNAX_LIBELLE_ACHAT;});}
document.addEventListener('click',function(e){
 var b=e.target.closest('.burger');if(b){var m=document.getElementById('menu');var o=m.classList.toggle('open');b.setAttribute('aria-expanded',o);}
 var s=e.target.closest('.sw button');if(s){var c=s.closest('.card');c.querySelectorAll('.sw button').forEach(function(x){x.setAttribute('aria-pressed',x===s)});var i=c.querySelector('.img img');i.src=s.dataset.img;i.alt=s.dataset.alt;var n=c.querySelector('.cname');if(n)n.textContent=s.dataset.name;}
 var d=e.target.closest('[aria-disabled=true]');if(d){e.preventDefault();}
});
var f=document.querySelector('form.wl');if(f){f.addEventListener('submit',function(e){e.preventDefault();var d=new FormData(f);var body='Nom : '+(d.get('nom')||'')+'%0AIntérêt : '+(d.get('interet')||'')+'%0AMessage : '+encodeURIComponent(d.get('message')||'');location.href='mailto:info@runax.ca?subject='+encodeURIComponent('Liste d’attente RUNAX')+'&body='+body;});}

/* V8.6 — bouton Voir le dos / Voir la face (bouton natif : clic, tap, Entrée et Espace) */
document.querySelectorAll('.pk-toggle').forEach(function(b){b.addEventListener('click',function(){var on=b.getAttribute('aria-pressed')!=='true';b.setAttribute('aria-pressed',on?'true':'false');b.textContent=on?b.dataset.dos:b.dataset.face;var im=document.getElementById(b.getAttribute('aria-controls'));if(im)im.classList.toggle('is-back',on);});});
