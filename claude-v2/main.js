/* RUNAX : navigation, coaching, boutique, panier et formulaires.
   Aucune dépendance. Les réglages publics sont dans config.js. */
(function () {
  "use strict";
  var C = window.RUNAX || window.PACENAX || {};
  var FAM = C.familles || {};
  var doc = document;
  doc.documentElement.classList.add("js");

  function all(sel, root) { return Array.prototype.slice.call((root || doc).querySelectorAll(sel)); }
  function one(sel, root) { return (root || doc).querySelector(sel); }

  // Montants en dollars canadiens, utilisés seulement si un prix réel est confirmé.
  var fmt0 = new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD", minimumFractionDigits: 0, maximumFractionDigits: 0 });
  var fmt2 = new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
  function money(n) { return Math.round(n * 100) % 100 === 0 ? fmt0.format(n) : fmt2.format(n); }
  function cents(n) { return Math.round(n * 100) / 100; }
  var TPS = 0.05, TVQ = 0.09975, QTY_MAX = 10, SHIP_FEE = 9.95, SHIP_FREE = 100;
  function shipCost(phys) { return phys > 0 && phys < SHIP_FREE ? SHIP_FEE : 0; }

  // Année du pied de page
  all("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  // Courriel configuré
  if (C.email) all("[data-email]").forEach(function (a) { a.textContent = C.email; a.href = "mailto:" + C.email; });

  // Réservation d'appel
  if (C.bookingUrl) all("[data-booking]").forEach(function (a) { a.href = C.bookingUrl; a.target = "_blank"; a.rel = "noopener"; });

  // Menu principal et sous-rubriques
  var toggle = one(".nav-toggle"), nav = doc.getElementById("nav");
  if (toggle && nav) {
    var submenus = all(".nav-sub", nav);
    var setNav = function (open) {
      toggle.setAttribute("aria-expanded", String(open));
      nav.classList.toggle("is-open", open);
      if (!open) submenus.forEach(function (submenu) { submenu.open = false; });
    };
    toggle.addEventListener("click", function () { setNav(toggle.getAttribute("aria-expanded") !== "true"); });
    submenus.forEach(function (submenu) {
      submenu.addEventListener("toggle", function () {
        if (submenu.open) submenus.forEach(function (other) { if (other !== submenu) other.open = false; });
      });
    });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) setNav(false); });
    doc.addEventListener("click", function (e) {
      if (!nav.contains(e.target) && !toggle.contains(e.target)) setNav(false);
    });
    doc.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      var expanded = nav.querySelector("details[open]");
      if (expanded) {
        expanded.open = false;
        one("summary", expanded).focus();
      } else if (toggle.getAttribute("aria-expanded") === "true") {
        setNav(false);
        toggle.focus();
      }
    });
  }

  // Préchargement de la page visée au survol ou au toucher (désactivé en mode économie de données)
  var conn = navigator.connection || {};
  if (!conn.saveData && !/(^|-)2g$/.test(conn.effectiveType || "")) {
    var seen = {};
    var warm = function (e) {
      var a = e.target.closest && e.target.closest("a[href]");
      if (!a || a.target === "_blank" || a.origin !== __L.origin) return;
      var url = a.pathname + a.search;
      if (seen[url] || a.pathname === __L.pathname) return;
      seen[url] = true;
      var l = doc.createElement("link"); l.rel = "prefetch"; l.href = url; l.as = "document";
      doc.head.appendChild(l);
    };
    doc.addEventListener("mouseover", warm, { passive: true });
    doc.addEventListener("touchstart", warm, { passive: true });
    doc.addEventListener("focusin", warm);
  }

  all("[data-local-interest]").forEach(function (form) {
    one("[type=submit]", form).disabled = false;
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var values = Object.fromEntries(new FormData(form));
      var notice = one("[data-local-status]", form);
      try {
        localStorage.setItem("px-interest:" + form.dataset.localInterest, JSON.stringify(values));
        form.reset();
        notice.textContent = "Ton intérêt a été enregistré sur cet appareil. Aucun courriel n’a été envoyé.";
      } catch (error) {
        notice.textContent = "Le stockage de ce navigateur est indisponible. Ta demande n’a pas été enregistrée.";
      }
    });
  });
  var guide = one("[data-size-dialog]");
  if (guide && typeof guide.showModal === "function") {
    var guideTrigger;
    all("[data-size-open]").forEach(function (button) {
      button.hidden = false;
      button.addEventListener("click", function () {
        guideTrigger = button;
        var panel = doc.getElementById(button.dataset.sizeOpen);
        one("[data-size-content]", guide).replaceChildren(panel.content.cloneNode(true));
        guide.showModal();
        one("[data-size-close]", guide).focus();
      });
    });
    one("[data-size-close]", guide).addEventListener("click", function () { guide.close(); });
    guide.addEventListener("keydown", function (event) {
      if (event.key === "Tab") {
        event.preventDefault();
        one("[data-size-close]", guide).focus();
      }
    });
    guide.addEventListener("cancel", function (event) {
      event.preventDefault();
      guide.close();
    });
    guide.addEventListener("close", function () { if (guideTrigger) guideTrigger.focus(); });
  }
  all("[data-glossary]").forEach(function (button) {
    button.addEventListener("click", function () {
      var expanded = button.getAttribute("aria-expanded") === "true";
      doc.getElementById(button.getAttribute("aria-controls")).hidden = expanded;
      button.setAttribute("aria-expanded", String(!expanded));
    });
  });

  var planFilters = one("[data-plan-filters]");
  if (planFilters) {
    var planButtons = all("[data-plan-filter]", planFilters);
    var planTiles = all("[data-plan]", planFilters.closest(".plan-directory"));
    planFilters.hidden = false;
    planButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        var category = button.dataset.planFilter;
        var count = 0;
        planButtons.forEach(function (candidate) {
          candidate.setAttribute("aria-pressed", String(candidate === button));
        });
        planTiles.forEach(function (tile) {
          tile.hidden = category !== "tous" && !tile.dataset.plan.split(" ").includes(category);
          if (!tile.hidden) count += 1;
        });
        one("[data-plan-count]").textContent = count + (count === 1 ? " programme affiché." : " programmes affichés.");
      });
    });
  }

  // ---- Recommandation : un point de départ avec une raison concrète, tirée des réponses ----
  // Utilisée par « Trouver ma préparation » (formations.html), l'orientation (nous-rejoindre.html)
  // et le résumé de la demande (inscription.html). Aucune donnée n'est enregistrée.
  var NBSP = " ", THIN = " ";
  function typo(text) {
    return text.replace(/(\d) (km|min|s)(?=[\s.,;:)]|$)/g, "$1" + NBSP + "$2").replace(/ ([:?])/g, THIN + "$1");
  }
  function listFr(parts) {
    return parts.length < 2 ? parts.join("") : parts.slice(0, -1).join(", ") + " et " + parts[parts.length - 1];
  }
  function upperFirst(text) { return text.charAt(0).toUpperCase() + text.slice(1); }
  var PATHS = {
    "premier-5-km": { name: "5 km · Début et reprise", anchor: "premier-5-km" },
    "chrono-5-km": { name: "5 km · Améliorer mon chrono", anchor: "chrono-5-km" },
    "premier-10-km": { name: "10 km · Mon premier 10 km", anchor: "premier-10-km" },
    "chrono-10-km": { name: "10 km · Améliorer mon chrono", anchor: "chrono-10-km" },
    semi: { name: "Semi-marathon", anchor: FAM["formations-en-ligne"] ? "course-semi" : "programme-semi" },
    technique: { name: "Technique de course", anchor: "course-technique" }
  };
  var PATH_WHY = {
    "premier-5-km": "Début et reprise alterne marche et course, sans chrono de référence : tu installes une routine et tu choisis ton effort selon tes sensations. Sa séance principale dure 25 min, à une allure à laquelle tu peux parler.",
    "chrono-5-km": "Ce parcours travaille la régularité de tes intervalles et la maîtrise de ton départ. Sa séance principale (26 min) enchaîne quatre répétitions de 90 s à effort contrôlé : l’objectif est de garder le même effort jusqu’à la dernière.",
    "premier-10-km": "Cette préparation allonge progressivement tes sorties et t’apprend à tenir une allure sur 10 km : point de départ, endurance, puis stratégie de course.",
    "chrono-10-km": "Ce parcours travaille ton allure cible, tes intervalles et ta récupération pour préparer un nouveau chrono.",
    semi: "Cette préparation organise une progression vers le 21,1 km autour de sorties longues, pour des personnes qui courent régulièrement.",
    technique: "Il t’aide à observer ta foulée et à intégrer des exercices techniques à ton entraînement."
  };
  var LEVEL_TEXT = { debut: "Tu débutes", reprise: "Tu reprends après une pause", regulier: "Tu cours régulièrement", "5": "Tu cours déjà 5 km", "10": "Tu as déjà couru un 10 km" };
  var DIST_TEXT = { "5": "tu vises un 5 km", "10": "tu vises un 10 km", semi: "tu vises un semi-marathon", marathon: "tu vises un marathon", ultra: "tu vises un ultramarathon", autre: "tu vises un autre format", indecis: "tu ne sais pas encore quelle distance viser" };
  var DAYS_TEXT = { 1: "tu peux courir un jour par semaine", 2: "tu peux courir deux jours par semaine", 3: "tu peux courir trois jours ou plus par semaine" };

  function talkHref(a, goal, formule) {
    var q = [];
    var add = function (key, value) { if (value !== undefined && value !== null && value !== "") q.push(key + "=" + encodeURIComponent(value)); };
    add("origine", a.origine);
    add("distance", a.distance);
    add("objectif", goal);
    add("niveau", a.niveau === "5" || a.niveau === "10" ? "regulier" : a.niveau);
    add("jours", a.jours);
    add("formule", formule || a.format);
    add("date", a.date);
    add("chrono", a.chrono);
    return "inscription.html" + (q.length ? "?" + q.join("&") : "");
  }

  // a = { distance, niveau, objectif, jours, format, origine, date, chrono } ; base = "" (même page) ou "formations.html"
  function recommend(a, base) {
    base = base || "";
    var dist = a.distance || "indecis", lvl = a.niveau || "", goal = a.objectif || "", format = a.format || "";
    var days = Math.min(Number(a.jours) || 0, 3);
    var beginner = lvl === "debut" || lvl === "reprise";
    var best;
    if (goal === "technique" && FAM["formations-en-ligne"]) best = "technique";
    else if (dist === "marathon" || dist === "ultra" || dist === "autre") best = "parler";
    else if (dist === "semi") best = beginner ? "premier-5-km" : lvl === "5" ? "premier-10-km" : days >= 3 ? "semi" : "parler";
    else if (dist === "10") best = beginner ? "premier-5-km" : lvl === "5" ? "premier-10-km" : (lvl === "10" || goal === "chrono") ? "chrono-10-km" : "premier-10-km";
    else if (dist === "5") best = beginner || goal === "premiere" ? "premier-5-km" : "chrono-5-km";
    else best = beginner ? "premier-5-km" : "parler";
    var goalForTalk = goal === "premiere" || goal === "chrono" ? goal : /^chrono/.test(best) ? "chrono" : /^premier/.test(best) ? "premiere" : goal;
    var P = function (anchor) { return base + "#" + anchor; };
    var other = { href: P("parcours-5-10"), label: "Voir une autre préparation" };
    var talk = FAM.contact ? { href: talkHref(a, goalForTalk), label: "Parler à Alexandre" } : null;

    var lead = [LEVEL_TEXT[lvl], goal === "technique" ? "tu veux travailler ta technique" : DIST_TEXT[dist], DAYS_TEXT[days]].filter(Boolean);
    var paragraphs = lead.length ? [typo(upperFirst(listFr(lead)) + ".")] : [];
    var title, primary, links, body = [];
    var club = false;
    club = !!FAM.club && (format === "club" || (days === 1 && best !== "parler" && best !== "technique"));

    if (club) {
      title = "Découvrir le Club RUNAX";
      body.push(days === 1 ? "La semaine d’exemple des préparations compte trois séances : avec un seul jour, le Club est un bon point d’entrée." : "Tu préfères courir en groupe : le Club est fait pour ça.");
      body.push("Le Club RUNAX propose une sortie footing encadrée d’environ 1 h par semaine, à Montréal, pour 19,98 $ CA par mois avant taxes. Il suffit de réserver ta place.");
      primary = { href: "groupes.html#sortie-decouverte", label: "Découvrir le Club RUNAX" };
      links = [talk];
      if (PATHS[best]) links.push({ href: P(PATHS[best].anchor), label: "Voir " + PATHS[best].name });
      else links.push(other);
    } else
    if (best === "parler") {
      title = "Parler à Alexandre";
      if (dist === "marathon" || dist === "ultra") body.push((dist === "ultra" ? "L’ultramarathon" : "Le marathon") + " se prépare avec Alexandre : il regarde ta pratique actuelle et ton objectif avant de proposer un format.");
      else if (dist === "autre") body.push("Les autres distances et les autres terrains se préparent avec Alexandre : il regarde ta pratique actuelle et ton objectif avant de proposer un format.");
      else if (dist === "semi") body.push("Le semi-marathon repose sur des sorties longues : avec " + (days === 2 ? "deux jours" : "peu de jours") + " par semaine, il vaut mieux construire un horaire réaliste avec Alexandre avant de choisir un plan.");
      else if (lvl === "10") body.push("Tu as déjà couru un 10 km : tu peux viser un nouveau chrono ou ouvrir la porte au semi-marathon. Alexandre t’aide à choisir à partir de ton objectif et de ton horaire.");
      else body.push("Tu cours déjà et tu hésites sur la distance : deux pistes se présentent, améliorer ton chrono sur 5 km ou viser un premier 10 km. Alexandre t’aide à choisir à partir de ton objectif et de ton horaire.");
      primary = talk;
      links = [other];
    } else {
      title = PATHS[best].name;
      if (best === "premier-5-km" && dist === "10") body.push("La préparation 10 km s’adresse à des personnes qui peuvent déjà compléter un 5 km : Début et reprise est le chemin le plus court vers ton premier 10 km.");
      else if (best === "premier-5-km" && dist === "semi") body.push("Le semi-marathon s’adresse à des personnes qui courent régulièrement : Début et reprise installe d’abord ta routine.");
      else if (best === "premier-10-km" && dist === "semi") body.push("Le semi-marathon s’adresse à des personnes qui passent du 10 km au 21,1 km : ton premier 10 km est l’étape logique.");
      else if (best === "premier-5-km" && dist === "indecis") body.push("Un premier 5 km est un objectif clair pour bâtir ta régularité.");
      body.push(PATH_WHY[best]);
      if (best !== "semi" && best !== "technique") {
        if (days >= 3) body.push("La semaine d’exemple compte trois séances : tu peux la suivre telle quelle.");
        else if (days === 2) body.push("La semaine d’exemple compte trois séances : avec deux jours, commence par la séance principale et une sortie facile, puis ajuste le reste avec Alexandre.");
      }
      primary = { href: P(PATHS[best].anchor), label: "Voir ce parcours" };
      links = [talk, other];
      if (talk && /^(plan|avance|total)$/.test(format)) { links = [{ href: primary.href, label: "Voir ce parcours" }, other]; primary = talk; }
    }
    paragraphs.push(typo(body.join(" ")));
    links = (links || []).filter(Boolean);
    if (!primary) primary = links.shift() || other;
    return {
      best: best, title: title, paragraphs: paragraphs, primary: primary, links: links,
      note: typo(FAM.contact ? "C’est un point de départ, pas un engagement. Une demande ne crée ni paiement ni abonnement." : "C’est un point de départ, pas un engagement.")
    };
  }

  var recoCount = 0;
  // level : "h2" | "h3" | "h4" ; options.inForm : dans le formulaire, les liens s'ouvrent dans un nouvel onglet
  function renderReco(r, level, options) {
    options = options || {};
    var card = doc.createElement("div"), kicker = doc.createElement("p"), title = doc.createElement(level || "h3");
    recoCount += 1;
    title.id = "reco-titre-" + recoCount;
    card.className = "reco";
    card.tabIndex = -1;
    card.setAttribute("role", "group");
    card.setAttribute("aria-labelledby", title.id);
    kicker.className = "reco-kicker";
    kicker.textContent = options.inForm ? "Un point de départ possible" : "Ton point de départ";
    title.className = "reco-title";
    title.textContent = r.title;
    card.append(kicker, title);
    r.paragraphs.forEach(function (text, index) {
      var p = doc.createElement("p");
      p.className = index === 0 && r.paragraphs.length > 1 ? "reco-lead" : "reco-reason";
      p.textContent = text;
      card.appendChild(p);
    });
    var actions = doc.createElement("div");
    actions.className = "reco-actions";
    var addLink = function (item, cls) {
      var link = doc.createElement("a");
      link.className = cls;
      link.href = item.href;
      link.textContent = item.label;
      if (options.inForm) { link.target = "_blank"; link.rel = "noopener"; link.setAttribute("aria-label", item.label + " (s’ouvre dans un nouvel onglet)"); }
      actions.appendChild(link);
    };
    if (options.inForm) {
      [r.primary].concat(r.links).filter(function (item) { return item.label !== "Parler à Alexandre"; }).forEach(function (item) { addLink(item, "link"); });
    } else {
      addLink(r.primary, "btn btn--primary");
      r.links.forEach(function (item) { addLink(item, "link"); });
    }
    card.appendChild(actions);
    var note = doc.createElement("p");
    note.className = "fine";
    note.textContent = options.inForm ? typo("Alexandre confirme la suite avec toi.") : r.note;
    card.appendChild(note);
    return card;
  }

  var quiz = one("[data-course-quiz]");
  if (quiz) {
    quiz.addEventListener("submit", function (event) {
      event.preventDefault();
      var answers = new FormData(quiz), result = one("[data-quiz-result]", quiz);
      var distance = answers.get("distance"), niveau = answers.get("niveau"), jours = answers.get("jours");
      if (!distance || !niveau || !jours) return;
      var card = renderReco(recommend({ distance: distance, niveau: niveau, jours: jours, origine: "quiz" }, ""), "h3");
      result.replaceChildren(card);
      card.focus();
    });
  }

  all("[data-open-details]").forEach(function (link) {
    link.addEventListener("click", function () {
      var details = doc.getElementById(link.hash.slice(1));
      if (details) details.open = true;
    });
  });
  var race = one("[data-race-filters]");
  if (race) {
    var filterRaces = function () {
      var selected = new FormData(race), visible = 0;
      all("[data-race]").forEach(function (card) {
        var data = card.dataset;
        card.hidden = Boolean((selected.get("ville") && data.city !== selected.get("ville")) ||
          (selected.get("date") && data.date < selected.get("date")) ||
          (selected.get("distance") && data.distance !== selected.get("distance")) ||
          (selected.get("terrain") && data.terrain !== selected.get("terrain")));
        if (!card.hidden) visible += 1;
      });
      one("[data-race-count]").textContent = visible ? visible + (visible === 1 ? " course" : " courses") : "Aucune course pour ces filtres.";
    };
    race.addEventListener("input", filterRaces);
    race.addEventListener("reset", function () { setTimeout(filterRaces, 0); });
    filterRaces();
  }
  var join = one("[data-join]");
  if (join) {
    var joinSteps = all("[data-join-step]", join), joinIndex = 0, jf = join.elements;
    var query = new URLSearchParams(__L.search);
    var nextJoin = one("[data-join-next]", join), backJoin = one("[data-join-back]", join);
    var joinResult = one("[data-join-result]", join);
    var dateValue = query.get("date");
    jf.distance.value = query.get("distance") || "";
    jf.objectif.value = query.get("objectif") || (query.has("course") ? "premiere" : "");
    if (dateValue && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) jf.date.value = dateValue;
    var showJoin = function (i, focus) {
      joinIndex = i;
      joinSteps.forEach(function (panel, n) {
        panel.hidden = i !== n;
        all("input,select", panel).forEach(function (field) { field.disabled = panel.hidden; });
      });
      var chrono = one("[data-join-chrono]", join);
      chrono.hidden = jf.objectif.value !== "chrono";
      jf.chrono.disabled = chrono.hidden || i !== 1;
      jf.date.disabled = jf.sansDate.checked || i !== 2;
      backJoin.hidden = i === 0;
      nextJoin.hidden = i === joinSteps.length;
      nextJoin.textContent = i === 3 ? "Voir ma recommandation" : "Continuer";
      one("[data-join-progress]").textContent = i === joinSteps.length ? "Ta recommandation" : "Étape " + (i + 1) + " de 4";
      if (i < joinSteps.length) {
        joinResult.replaceChildren();
        if (focus) { var heading = one("h2", joinSteps[i]); heading.tabIndex = -1; heading.focus(); }
      }
    };
    jf.sansDate.addEventListener("change", function () { jf.date.disabled = jf.sansDate.checked; });
    backJoin.addEventListener("click", function () { showJoin(joinIndex - 1, true); });
    join.addEventListener("submit", function (event) {
      event.preventDefault();
      if (joinIndex >= joinSteps.length || !join.reportValidity()) return;
      if (joinIndex < joinSteps.length - 1) { showJoin(joinIndex + 1, true); return; }
      var frequency = Number(jf.frequence.value) || 0, objective = jf.objectif.value;
      var level = objective === "debut" ? "debut" : objective === "routine" ? "reprise" : frequency === 0 ? "debut" : frequency === 1 ? "reprise" : "regulier";
      var card = renderReco(recommend({
        distance: jf.distance.value || "indecis", niveau: level,
        objectif: objective === "premiere" || objective === "chrono" ? objective : "",
        jours: jf.jours.value, format: jf.format.value, origine: "orientation",
        date: jf.sansDate.checked ? "" : jf.date.value,
        chrono: objective === "chrono" ? jf.chrono.value.trim().slice(0, 60) : ""
      }, "formations.html"), "h2");
      showJoin(joinSteps.length, false);
      joinResult.replaceChildren(card);
      card.focus();
    });
    showJoin(0, false);
    join.hidden = false;
  }

  // Contact : sujet présélectionné par le lien
  var params = new URLSearchParams(__L.search);
  if (doc.body && doc.body.classList.contains("storefront") && (params.has("categorie") || /^#(?:collection|tailles|recherche|produit-)/.test(__L.hash))) {
    __L.replace("catalogue.html" + __L.search + __L.hash);
  }
  var sujet = params.get("sujet")?.replace(/\bPACENAX\b/g, "RUNAX"), csel = doc.getElementById("c-sujet");
  if (csel && sujet) { for (var q = 0; q < csel.options.length; q++) { if (csel.options[q].value === sujet) { csel.selectedIndex = q; break; } } }

  // Demande « Parler à un coach » : quatre étapes courtes, réponses conservées, résumé modifiable.
  var onboarding = one(".coach-intake");
  if (onboarding) {
    var fields = onboarding.elements;
    var steps = all("[data-step]", onboarding);
    var SUMMARY = steps.length - 1;
    var current = 0, furthest = 0, returnTo = -1;
    var button = one("[data-submit]", onboarding);
    var stepper = one("[data-stepper]");
    var progress = one("[data-form-progress]");
    var demo = !C.formEndpoint && !C.email;
    var choose = function (name, value) {
      var field = fields[name];
      if (field && value && all("option", field).some(function (option) { return option.value === value; })) { field.value = value; return true; }
      return false;
    };

    // Arrivée depuis une fiche, le quiz ou l'orientation : on présélectionne, tout reste modifiable.
    var DIST_VALUE = { "5": "5 km", "10": "10 km", semi: "Semi-marathon", marathon: "Marathon", ultra: "Ultramarathon", indecis: "À choisir ensemble", autre: "Autre" };
    var origin = params.get("origine") || "", arrived = [];
    var wanted = params.get("distance");
    if (wanted === "10-km") wanted = "10";
    var legacy = params.get("discipline");
    if (!wanted && legacy === "ultra") wanted = "ultra";
    if (!wanted && (legacy === "piste" || legacy === "trail")) wanted = "autre";
    if (wanted && Object.hasOwn(DIST_VALUE, wanted) && choose("distance_objectif", DIST_VALUE[wanted])) arrived.push("distance");
    if (legacy === "piste" || legacy === "trail") choose("discipline", legacy);
    if (choose("objectif", params.get("objectif"))) arrived.push("objectif");
    var wantedLevel = params.get("niveau");
    if (wantedLevel === "5" || wantedLevel === "10") wantedLevel = "regulier";
    if (choose("niveau", wantedLevel)) arrived.push("niveau");
    var wantedDays = params.get("jours");
    if (choose("jours", Number(wantedDays) >= 4 ? "4 ou plus" : wantedDays)) arrived.push("jours");
    if (choose("formule", params.get("formule"))) arrived.push("formule"); else choose("formule", "conseil");
    var wantedDate = params.get("date");
    if (wantedDate && /^\d{4}-\d{2}-\d{2}$/.test(wantedDate)) { fields.date_course.value = wantedDate; arrived.push("date"); }
    if (params.get("chrono")) fields.resultat_recent.value = params.get("chrono").slice(0, 60);
    var originNote = one("[data-form-origin]");
    if (originNote && arrived.length) {
      originNote.textContent = /^fiche-/.test(origin) && arrived.indexOf("distance") > -1
        ? typo("Tu viens de la préparation " + DIST_VALUE[wanted].toLowerCase() + " : on a présélectionné cette distance. Tu peux la modifier à l’étape 1.")
        : "On a repris les réponses que tu as déjà données. Relis-les et modifie ce que tu veux : rien n’est figé.";
      originNote.hidden = false;
    }

    var FORMULE_HINT = {
      conseil: "Pas de souci : Alexandre t’aide à choisir à partir de ta demande."
    };
    FORMULE_HINT.autonome = "Formation autonome : leçons, exercices et calendrier d’exemple à suivre à ton rythme. Les échanges avec Alexandre viennent avec une formule de coaching.";
    FORMULE_HINT.plan = "Plan mensuel : Alexandre écrit ton plan à partir de ton niveau, de tes disponibilités et de ton objectif. Tes retours guident les révisions. Une révision par mois, 49 $ CA par mois.";
    FORMULE_HINT.avance = "Suivi avancé : des échanges renforcés et des ajustements plus fréquents qu’avec le Plan mensuel. Un ajustement par semaine et un appel vidéo par mois, 109 $ CA par mois.";
    FORMULE_HINT.total = "Coaching personnalisé complet : un suivi rapproché, avec des échanges et des ajustements prioritaires. Réponses dans la journée et deux appels vidéo par mois, 199 $ CA par mois.";
    FORMULE_HINT.club = "Club / sorties de groupe : une sortie footing encadrée d’environ 1 h par semaine, 19,98 $ CA par mois avant taxes, à Montréal.";
    FORMULE_HINT.atelier = "Atelier technique : un atelier en petit groupe sur ta foulée, avec des exercices sur piste, à une date communiquée aux inscrits. 35 $ CA par personne.";
    var conditionals = function () {
      var dist = fields.distance_objectif.value, level = fields.niveau.value, goal = fields.objectif.value, terrain = fields.discipline.value;
      var other = dist === "Autre";
      var active = {
        autre: other,
        suivi: level === "reprise" || level === "regulier",
        chrono: (goal === "chrono" || goal === "competition") && level !== "debut" && level !== "",
        piste: other && terrain === "piste",
        sentier: dist === "Ultramarathon" || (other && (terrain === "trail" || terrain === "ultra")),
        appel: fields.contact_prefere.value === "appel"
      };
      all("[data-coach-when]", onboarding).forEach(function (group) {
        var show = Boolean(active[group.dataset.coachWhen]);
        group.hidden = !show;
        all("input,select,textarea", group).forEach(function (field) { field.disabled = !show; });
      });
      fields.frequence.required = active.suivi;
      fields.discipline.required = active.autre;
      one("[data-formule-hint]", onboarding).textContent = typo(FORMULE_HINT[fields.formule.value] || "");
    };

    var intakeAnswers = function () {
      var distMap = { "5 km": "5", "10 km": "10", "Semi-marathon": "semi", Marathon: "marathon", Ultramarathon: "ultra", Autre: "autre", "À choisir ensemble": "indecis" };
      var goal = fields.objectif.value, days = fields.jours.value;
      return {
        distance: distMap[fields.distance_objectif.value] || "indecis",
        niveau: fields.niveau.value,
        objectif: goal === "premiere" || goal === "chrono" || goal === "technique" ? goal : goal === "competition" ? "chrono" : "",
        jours: days === "4 ou plus" ? 4 : Number(days) || 0,
        format: fields.formule.value === "club" ? "club" : fields.formule.value
      };
    };

    var groups = [
      ["Ton objectif", ["distance_objectif", "discipline", "distance_precision", "objectif", "course_cible", "date_course"]],
      ["Ta pratique", ["niveau", "frequence", "sortie_recente", "resultat_recent", "experience_piste", "terrain_sentier"]],
      ["Ton rythme de vie", ["jours", "temps", "disponibilites", "formule", "sensations_contraintes"]]
    ];
    var rowsOf = function (names) {
      var rows = [];
      names.forEach(function (name) {
        var field = fields[name];
        if (!field || field.disabled || !field.value.trim()) return;
        var value = field.tagName === "SELECT" ? (field.selectedOptions[0].getAttribute("data-full") || field.selectedOptions[0].textContent) : field.value.trim();
        if (field.type === "date") value = new Date(field.value + "T12:00:00").toLocaleDateString("fr-CA", { year: "numeric", month: "long", day: "numeric" });
        rows.push([field.getAttribute("data-short") || labelOf(onboarding, field).replace(/ \(facultatif\)$/, ""), value]);
      });
      return rows;
    };
    var summary = function () {
      var target = one("[data-coach-summary]", onboarding);
      target.replaceChildren(renderReco(recommend(intakeAnswers(), "formations.html"), "h4", { inForm: true }));
      groups.forEach(function (group, index) {
        var panel = doc.createElement("section"), heading = doc.createElement("h4"), list = doc.createElement("dl"), rows = rowsOf(group[1]);
        panel.className = "coach-summary-card";
        heading.textContent = group[0];
        panel.appendChild(heading);
        rows.forEach(function (row) {
          var term = doc.createElement("dt"), value = doc.createElement("dd");
          term.textContent = row[0];
          value.textContent = row[1];
          list.append(term, value);
        });
        if (rows.length) panel.appendChild(list);
        else { var empty = doc.createElement("p"); empty.textContent = "Rien à partager pour l’instant."; panel.appendChild(empty); }
        var edit = doc.createElement("button");
        edit.type = "button";
        edit.className = "link coach-edit";
        edit.textContent = "Modifier";
        edit.setAttribute("aria-label", "Modifier : " + group[0]);
        edit.addEventListener("click", function () { returnTo = SUMMARY; go(index); });
        panel.appendChild(edit);
        target.appendChild(panel);
      });
    };

    var refresh = function () {
      progress.textContent = typo("Étape " + (current + 1) + " sur " + steps.length + " · " + steps[current].dataset.label);
      all(".stepper-item", stepper).forEach(function (item, i) {
        item.disabled = i > furthest;
        item.classList.toggle("is-done", i < current || (i > current && i <= furthest));
        if (i === current) item.setAttribute("aria-current", "step"); else item.removeAttribute("aria-current");
      });
    };
    var go = function (index, focus) {
      current = index;
      furthest = Math.max(furthest, index);
      if (index === SUMMARY) returnTo = -1;
      steps.forEach(function (step, i) {
        step.hidden = i !== index;
        step.classList.toggle("is-current", i === index);
      });
      all("[data-step-next]", steps[index]).forEach(function (next) {
        next.textContent = returnTo > -1 && index < returnTo ? "Revenir à mon résumé" : "Continuer";
      });
      conditionals();
      if (originNote && arrived.length) originNote.hidden = index !== 0;
      if (index === SUMMARY) summary();
      refresh();
      if (focus !== false) {
        var heading = one("h3", steps[index]);
        heading.tabIndex = -1;
        heading.focus();
      }
    };
    var clearError = function (field) {
      if (!field.id) return;
      field.removeAttribute("aria-describedby");
      field.removeAttribute("aria-invalid");
    };
    var showError = function (bad, index) {
      if (index !== current) go(index);
      var error = one("[data-step-error]", steps[index]);
      error.textContent = bad.type === "email" ? "Vérifie ton adresse courriel." : "Réponds au champ « " + labelOf(onboarding, bad) + " » pour continuer.";
      error.hidden = false;
      bad.setAttribute("aria-describedby", error.id);
      bad.focus();
    };

    steps.forEach(function (step, i) {
      var item = doc.createElement("li"), jump = doc.createElement("button"), num = doc.createElement("span"), label = doc.createElement("span");
      jump.type = "button";
      jump.className = "stepper-item";
      num.className = "stepper-n";
      num.setAttribute("aria-hidden", "true");
      num.textContent = String(i + 1);
      label.className = "stepper-l";
      label.textContent = step.dataset.label;
      jump.append(num, label);
      jump.addEventListener("click", function () {
        if (i === current || i > furthest) return;
        for (var k = current; k < i; k += 1) {
          var bad = validate(onboarding, steps[k]);
          if (bad) return showError(bad, k);
        }
        returnTo = -1;
        go(i);
      });
      item.appendChild(jump);
      stepper.appendChild(item);
    });
    all("[data-step-next]", onboarding).forEach(function (next) {
      next.addEventListener("click", function () {
        var bad = validate(onboarding, steps[current]);
        if (bad) return showError(bad, current);
        one("[data-step-error]", steps[current]).hidden = true;
        go(returnTo > -1 && current < returnTo ? returnTo : current + 1);
      });
    });
    all("[data-step-back]", onboarding).forEach(function (back) {
      back.addEventListener("click", function () { go(current - 1); });
    });
    onboarding.addEventListener("input", function (event) {
      clearError(event.target);
      one("[data-step-error]", steps[current]).hidden = true;
      conditionals();
    });

    // Texte copiable de la demande (même contenu que le résumé)
    var requestText = function () {
      var lines = ["Demande RUNAX · Parler à Alexandre", ""];
      groups.forEach(function (group) {
        var rows = rowsOf(group[1]);
        if (!rows.length) return;
        lines.push("— " + group[0] + " —");
        rows.forEach(function (row) { lines.push(row[0] + " : " + row[1]); });
        lines.push("");
      });
      var contact = [];
      [["prenom", "Prénom"], ["courriel", "Courriel"], ["contact_prefere", "Contact préféré"], ["telephone", "Téléphone"]].forEach(function (pair) {
        var field = fields[pair[0]];
        if (field && !field.disabled && field.value.trim()) contact.push(pair[1] + " : " + (field.tagName === "SELECT" ? field.selectedOptions[0].textContent : field.value.trim()));
      });
      if (contact.length) lines.push("— Pour te joindre —", contact.join("\n"));
      return lines.join("\n").trim();
    };
    onboarding.addEventListener("submit", function (event) {
      if (current !== SUMMARY) {
        event.preventDefault();
        event.stopImmediatePropagation();
        one("[data-step-next]", steps[current]).click();
        return;
      }
      for (var i = 0; i < steps.length; i += 1) {
        var bad = validate(onboarding, steps[i]);
        if (bad) {
          event.preventDefault();
          event.stopImmediatePropagation();
          showError(bad, i);
          return;
        }
      }
    });
    if (demo) {
      fields.prenom.required = false;
      fields.courriel.required = false;
    } else {
      button.textContent = "Envoyer ma demande";
      var coachDemo = one("[data-coach-demo]", onboarding);
      if (coachDemo) coachDemo.hidden = true;
    }
    conditionals();
    go(0, false);
    onboarding.hidden = false;
  }

  function readJson(id) {
    var el = doc.getElementById(id);
    if (!el) return null;
    try { return JSON.parse(el.textContent); } catch (e) { return null; }
  }

  // Panier (conservé dans le navigateur)
  // Si le navigateur bloque le stockage local (aperçu en bac à sable, navigation privée stricte),
  // le panier suit l'onglet par window.name : il ne contient que des articles, aucune donnée personnelle.
  var KEY = "px-cart", TAB = KEY + "=", live = doc.getElementById("live");
  // Stockage unique : localStorage, sinon window.name (la clé suit l'onglet).
  var STORE_TAG = "px-store=";
  function nameMap() {
    try { return window.name.indexOf(STORE_TAG) === 0 ? JSON.parse(window.name.slice(STORE_TAG.length)) || {} : {}; } catch (e) { return {}; }
  }
  function sget(key) {
    try { var v = localStorage.getItem(key); if (v !== null) return v; } catch (e) {}
    var m = nameMap();
    return m[key] != null ? m[key] : null;
  }
  function sset(key, val) {
    try { if (val === null) localStorage.removeItem(key); else localStorage.setItem(key, val); return; } catch (e) {}
    var m = nameMap();
    if (val === null) delete m[key]; else m[key] = val;
    try { window.name = STORE_TAG + JSON.stringify(m); } catch (e2) {}
  }
  function readCart() { return sget(KEY); }
  function writeCart(json) { sset(KEY, json); }
  // Articles retirés du catalogue (dont la montre de sport GPS) : écartés des anciens paniers, le reste est conservé.
  // Ne réutilise pas ces identifiants pour de nouveaux produits (« sac » pour la future catégorie Sacs, par exemple) : retire-les d'abord de cette liste.
  var RETIRED = ["montre", "lunettes", "sac", "valise", "kangourou"], removedCount = 0;
  function loadCart() {
    try {
      var c = JSON.parse(readCart());
      if (!Array.isArray(c)) return [];
      var clean = c.filter(function (i) { return i && i.id && i.qte > 0 && RETIRED.indexOf(i.id) === -1; });
      var dropped = c.filter(function (i) { return i && RETIRED.indexOf(i.id) !== -1; }).length;
      if (dropped) { removedCount += dropped; writeCart(JSON.stringify(clean)); }
      return clean;
    } catch (e) { return []; }
  }
  function updateCount(c) {
    var n = (c || loadCart()).reduce(function (a, i) { return a + i.qte; }, 0);
    all("[data-cart-count]").forEach(function (el) { el.textContent = n; });
    all(".cart-btn").forEach(function (b) { b.setAttribute("aria-label", "Panier : " + n + (n > 1 ? " articles" : " article")); });
  }
  function saveCart(c) { writeCart(JSON.stringify(c)); updateCount(c); }
  function say(text) { if (live) { live.textContent = ""; setTimeout(function () { live.textContent = text; }, 50); } }
  updateCount();
  window.addEventListener("storage", function (e) { if (e.key === KEY) updateCount(); });

  // Boutique : recherche, catégories, filtres, galerie des fiches et repères de page
  var cards = all("[data-product]");
  var rootEl = doc.documentElement;
  var siteHeader = one(".site-header");
  var syncHeader = function () { if (siteHeader) rootEl.style.setProperty("--hdr-h", siteHeader.offsetHeight + "px"); };
  syncHeader();
  window.addEventListener("resize", syncHeader);

  // Recherche de la barre de boutique : ouvre le catalogue déjà filtré (sans JavaScript, le formulaire fait la même chose en GET)
  all("form[data-shop-redirect]").forEach(function (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var q = one("input[name=q]", form).value.trim();
      __L.href = form.getAttribute("action") + (q ? "?q=" + encodeURIComponent(q) : "") + "#collection";
    });
  });

  var shopGrid = one("[data-shop]");
  if (shopGrid) {
    var shopCards = all(".rx-card", shopGrid);
    var shopCount = one("[data-shop-count]"), shopEmpty = one("[data-shop-empty]");
    var shopSearch = one("[data-shop-search]");
    var chips = all("[data-filter]"), subGroups = all("[data-subgroup]"), subChips = all("[data-subfilter]");
    var facetBox = one("[data-filters]"), facetCount = one("[data-filters-count]");
    var facetInputs = facetBox ? all("input[type=checkbox]", facetBox) : [];
    var FACETS = ["activite", "statut", "taille", "couleur", "marque", "prix"];
    var blankFacets = function () { var o = {}; FACETS.forEach(function (k) { o[k] = []; }); return o; };
    var shopState = { cat: "tous", sub: "", q: "", facets: blankFacets() };
    var fold = function (v) {
      return String(v || "").toLocaleLowerCase("fr-CA").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[’']/g, " ").replace(/\s+/g, " ").trim();
    };
    shopCards.forEach(function (card) { card._hay = fold(card.getAttribute("data-search") + " " + card.getAttribute("data-name")); });
    var tokensOf = function () { return fold(shopState.q).split(" ").filter(Boolean); };
    var matches = function (card, tokens) {
      var d = card.dataset;
      if (shopState.cat !== "tous" && d.groupe !== shopState.cat) return false;
      if (shopState.sub && d.sous !== shopState.sub) return false;
      if (tokens.length && !tokens.every(function (t) { return card._hay.indexOf(t) !== -1; })) return false;
      var f = shopState.facets;
      if (f.activite.length) {
        var acts = (d.activites || "").split(" ");
        if (!f.activite.some(function (a) { return acts.indexOf(a) !== -1; })) return false;
      }
      if (f.statut.length && f.statut.indexOf(d.statut) === -1) return false;
      if (f.taille.length) {
        var sizes = (d.tailles || "").split(" ");
        if (!f.taille.some(function (s) { return sizes.indexOf(s) !== -1; })) return false;
      }
      if (f.couleur.length) {
        var colors = (d.couleurs || "").split(" ");
        if (!f.couleur.some(function (c) { return colors.indexOf(c) !== -1; })) return false;
      }
      if (f.marque.length && f.marque.indexOf(d.marque) === -1) return false;
      if (f.prix.length) {
        var price = d.price === "" ? null : Number(d.price);
        var ok = f.prix.some(function (k) {
          if (k === "tbd") return price === null;
          if (price === null) return false;
          return k === "moins50" ? price < 50 : price >= 50 && price <= 100;
        });
        if (!ok) return false;
      }
      return true;
    };
    var facetTotal = function () { return FACETS.reduce(function (a, k) { return a + shopState.facets[k].length; }, 0); };
    var syncUrl = function () {
      try {
        var p = new URLSearchParams();
        if (shopState.cat !== "tous") p.set("categorie", shopState.cat);
        if (shopState.sub) p.set("sous", shopState.sub);
        if (shopState.q) p.set("q", shopState.q);
        FACETS.forEach(function (k) { if (shopState.facets[k].length) p.set(k, shopState.facets[k].join(",")); });
        var qs = p.toString();
        history.replaceState(null, "", __L.pathname + (qs ? "?" + qs : "") + __L.hash);
      } catch (e) { /* aperçu intégré : l'adresse reste telle quelle */ }
    };
    var shopRefresh = function (writeUrl) {
      var tokens = tokensOf(), n = 0;
      shopCards.forEach(function (card) {
        var show = matches(card, tokens);
        card.hidden = !show;
        if (show) n += 1;
      });
      chips.forEach(function (ch) {
        var on = ch.getAttribute("data-filter") === shopState.cat;
        ch.classList.toggle("is-on", on); ch.setAttribute("aria-pressed", String(on));
      });
      subGroups.forEach(function (g) { g.hidden = g.getAttribute("data-subgroup") !== shopState.cat; });
      subChips.forEach(function (ch) {
        var on = ch.getAttribute("data-subfilter") === shopState.sub;
        ch.classList.toggle("is-on", on); ch.setAttribute("aria-pressed", String(on));
      });
      var narrowed = shopState.cat !== "tous" || shopState.sub || tokens.length || facetTotal() > 0;
      if (shopCount) shopCount.textContent = n + (n > 1 ? " pièces" : " pièce") + (narrowed ? " sur " + shopCards.length : "");
      if (shopEmpty) shopEmpty.hidden = n !== 0;
      var active = facetTotal();
      if (facetCount) facetCount.textContent = active ? active + (active > 1 ? " actifs" : " actif") : "";
      if (writeUrl) syncUrl();
    };
    var setCat = function (cat) {
      if (cat !== shopState.cat) shopState.sub = "";
      shopState.cat = cat;
      shopRefresh(true);
    };
    chips.forEach(function (ch) { ch.addEventListener("click", function () { setCat(ch.getAttribute("data-filter")); }); });
    subChips.forEach(function (ch) {
      ch.addEventListener("click", function () {
        var id = ch.getAttribute("data-subfilter");
        shopState.sub = shopState.sub === id ? "" : id;
        shopRefresh(true);
      });
    });
    if (shopSearch) shopSearch.addEventListener("input", function () { shopState.q = shopSearch.value.trim(); shopRefresh(true); });
    facetInputs.forEach(function (input) {
      input.addEventListener("change", function () {
        FACETS.forEach(function (k) {
          shopState.facets[k] = facetInputs.filter(function (i) { return i.getAttribute("data-facet") === k && i.checked; }).map(function (i) { return i.value; });
        });
        shopRefresh(true);
      });
    });
    all("[data-shop-reset]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        shopState = { cat: "tous", sub: "", q: "", facets: blankFacets() };
        if (shopSearch) shopSearch.value = "";
        facetInputs.forEach(function (i) { i.checked = false; });
        shopRefresh(true);
        if (shopSearch) shopSearch.focus();
      });
    });
    // État de départ : adresse de la page (liens du menu, recherche de la boutique, anciens liens)
    var LEGACY = {
      tshirts: ["hauts", "t-shirts"], debardeurs: ["hauts", "camisoles"], "manches-longues": ["hauts", ""], entrainement: ["hauts", ""],
      shorts: ["bas", "shorts"], collants: ["bas", "collants"],
      "casquettes-bandeaux": ["accessoires", "casquettes"], chaussettes: ["accessoires", "chaussettes"],
      sacs: ["accessoires", ""], lunettes: ["accessoires", ""], montres: ["accessoires", ""], valises: ["accessoires", ""]
    };
    var qs = new URLSearchParams(__L.search);
    var wantCat = qs.get("categorie") || "", wantSub = qs.get("sous") || "";
    if (Object.hasOwn(LEGACY, wantCat)) { wantSub = wantSub || LEGACY[wantCat][1]; wantCat = LEGACY[wantCat][0]; }
    if (chips.some(function (c) { return c.getAttribute("data-filter") === wantCat; })) shopState.cat = wantCat;
    if (shopState.cat !== "tous" && subChips.some(function (c) { return c.getAttribute("data-subfilter") === wantSub && c.parentNode.getAttribute("data-subgroup") === shopState.cat; })) shopState.sub = wantSub;
    shopState.q = (qs.get("q") || "").trim().slice(0, 80);
    if (shopSearch) shopSearch.value = shopState.q;
    FACETS.forEach(function (k) {
      var wanted = (qs.get(k) || "").split(",");
      shopState.facets[k] = facetInputs.filter(function (i) { return i.getAttribute("data-facet") === k && wanted.indexOf(i.value) !== -1; }).map(function (i) { return i.value; });
      facetInputs.forEach(function (i) { if (i.getAttribute("data-facet") === k) i.checked = shopState.facets[k].indexOf(i.value) !== -1; });
    });
    if (facetBox && facetTotal() > 0) facetBox.open = true;
    shopRefresh(false);
  }

  // Fiche produit : galerie (vue produit, studio, porté, gros plan)
  all("[data-gallery]").forEach(function (gallery) {
    var stage = one(".rx-stage img", gallery), caption = one("[data-gallery-caption]", gallery);
    var thumbs = all("[data-gallery-src]", gallery);
    if (!stage || thumbs.length < 2) return;
    var warmed = false;
    var warmAll = function () {
      if (warmed) return;
      warmed = true;
      thumbs.forEach(function (b) { var im = new Image(); im.src = b.getAttribute("data-gallery-src"); });
    };
    gallery.addEventListener("pointerenter", warmAll, { once: true });
    gallery.addEventListener("focusin", warmAll, { once: true });
    thumbs.forEach(function (b, idx) {
      b.addEventListener("click", function () {
        stage.removeAttribute("srcset");
        stage.src = b.getAttribute("data-gallery-src");
        var set = b.getAttribute("data-gallery-srcset");
        if (set) stage.setAttribute("srcset", set);
        stage.alt = b.getAttribute("data-gallery-alt") || "";
        stage.classList.toggle("is-photo", idx > 0 && !b.hasAttribute("data-gallery-flat"));
        if (caption) caption.textContent = b.getAttribute("data-gallery-label") || "";
        thumbs.forEach(function (t) { t.setAttribute("aria-pressed", String(t === b)); });
      });
    });
  });

  // Page Programmes et formations : repère de la section affichée
  var subnav = one(".rx-subnav");
  if (subnav) {
    var navLinks = all("a[href^='#']", subnav).map(function (a) { return { a: a, target: doc.getElementById(a.getAttribute("href").slice(1)) }; }).filter(function (x) { return x.target; });
    var ticking = false;
    var markCurrent = function () {
      ticking = false;
      var line = (siteHeader ? siteHeader.offsetHeight : 0) + subnav.offsetHeight + 24, current = null;
      navLinks.forEach(function (x) { if (x.target.getBoundingClientRect().top <= line) current = x; });
      navLinks.forEach(function (x) { if (x === current) x.a.setAttribute("aria-current", "true"); else x.a.removeAttribute("aria-current"); });
    };
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; window.requestAnimationFrame(markCurrent); } }, { passive: true });
    markCurrent();
  }

  // Boutique : taille, quantité, ajout au panier
  var toast = doc.getElementById("toast"), toastTimer;
  function showToast(text) {
    if (!toast) return;
    toast.textContent = "";
    var s = doc.createElement("span"); s.textContent = text;
    var a = doc.createElement("a"); a.className = "btn btn--primary"; a.href = "panier.html"; a.textContent = "Voir le panier";
    toast.appendChild(s); toast.appendChild(a);
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { if (!toast.contains(doc.activeElement)) toast.hidden = true; }, 7000);
  }
  cards.forEach(function (card) {
    var add = one("[data-add]", card);
    if (!add) return;
    var radios = all("input[type=radio]", card), sizes = one(".sizes", card), msg = one(".product-msg", card);
    var out = one("[data-qty] output", card), less = one("[data-qty-less]", card), more = one("[data-qty-more]", card);
    var qte = 1;
    var showQty = function () {
      if (out) out.textContent = qte;
      if (less) less.disabled = qte <= 1;
      if (more) more.disabled = qte >= QTY_MAX;
    };
    if (less) less.addEventListener("click", function () { if (qte > 1) { qte -= 1; showQty(); } });
    if (more) more.addEventListener("click", function () { if (qte < QTY_MAX) { qte += 1; showQty(); } });
    showQty();
    var clearMsg = function () { if (msg) { msg.hidden = true; msg.textContent = ""; } if (sizes) sizes.classList.remove("is-invalid"); };
    radios.forEach(function (r) { r.addEventListener("change", clearMsg); });

    add.addEventListener("click", function () {
      var name = card.getAttribute("data-name"), id = card.getAttribute("data-product");
      var isCourse = card.getAttribute("data-kind") === "course";
      var taille = isCourse ? "" : "Taille unique";
      if (radios.length) {
        var r = radios.filter(function (x) { return x.checked; })[0];
        if (!r) {
          if (msg) { msg.textContent = "Choisis une taille avant d’ajouter cette pièce au panier."; msg.hidden = false; }
          if (sizes) sizes.classList.add("is-invalid");
          radios[0].focus();
          return;
        }
        taille = r.value;
      }
      clearMsg();
      var c = loadCart(), price = card.getAttribute("data-price");
      var found = c.filter(function (i) { return i.id === id && i.taille === taille; })[0];
      if (found) found.qte = isCourse ? 1 : Math.min(QTY_MAX, found.qte + qte);
      else c.push({ id: id, nom: name, taille: taille, qte: qte, prix: price === "" ? null : Number(price) });
      saveCart(c);
      var text = name + (!taille || taille === "Taille unique" ? "" : ", taille " + taille) + (qte > 1 ? ", quantité " + qte : "") + " : ajouté au panier.";
      showToast(text); say(text);
      qte = 1; showQty();
    });
  });

  // Page du panier
  var cartList = doc.getElementById("cart-list");
  if (cartList) {
    var cartEmpty = doc.getElementById("cart-empty"), cartForm = doc.getElementById("cart-form");
    var shop = readJson("boutique-catalogue") || {};
    var cartNotice = one("[data-cart-notice]");
    if (cartNotice && removedCount) {
      cartNotice.textContent = removedCount > 1
        ? "Des articles qui ne sont plus au catalogue ont été retirés de ton panier. Les autres articles sont conservés."
        : "Un article qui n’est plus au catalogue a été retiré de ton panier. Les autres articles sont conservés.";
      cartNotice.hidden = false;
    }
    var sizeText = function (it) { return shop[it.id].kind === "course" ? "Formation en ligne" : it.taille === "Taille unique" ? "Taille unique" : "Taille " + it.taille; };
    var renderCart = function (focusIdx) {
      // Les noms et les prix viennent toujours du catalogue courant, pas de ce qui a été gardé dans le navigateur.
      var c = loadCart().filter(function (it) { return shop[it.id]; });
      c.forEach(function (it) { it.nom = shop[it.id].nom; it.prix = shop[it.id].prix; });
      var n = 0, total = 0, physTotal = 0, unpriced = false;
      var groups = {};
      all("[data-cart-group]", cartList).forEach(function (section) {
        var list = one("ul", section);
        list.replaceChildren();
        groups[section.dataset.cartGroup] = list;
      });
      c.forEach(function (it, idx) {
        n += it.qte;
        if (it.prix == null) unpriced = true; else { total += it.prix * it.qte; if (shop[it.id].kind === "physical") physTotal += it.prix * it.qte; }
        var li = doc.createElement("li"); li.className = "cart-item";
        var info = doc.createElement("div"), h = doc.createElement("strong"), sub = doc.createElement("span");
        h.textContent = it.nom; sub.className = "cart-sub";
        sub.textContent = sizeText(it) + (it.prix == null ? "" : " · " + money(it.prix) + " CA l’unité");
        info.appendChild(h); info.appendChild(sub);
        var qty = doc.createElement("div"); qty.className = "qty";
        var change = function (delta) {
          var cc = c.slice(); cc[idx].qte = Math.min(QTY_MAX, cc[idx].qte + delta);
          if (cc[idx].qte < 1) cc.splice(idx, 1);
          saveCart(cc); renderCart(idx);
        };
        var mk = function (label, aria, delta, off) {
          var b = doc.createElement("button"); b.type = "button"; b.textContent = label;
          b.setAttribute("aria-label", aria + " " + it.nom + ", " + sizeText(it).toLowerCase());
          b.disabled = off; b.setAttribute("data-step", delta);
          b.addEventListener("click", function () { change(delta); });
          return b;
        };
        var qn = doc.createElement("span"); qn.textContent = it.qte; qn.setAttribute("aria-label", "Quantité : " + it.qte);
        qty.appendChild(mk("−", "Retirer un exemplaire de", -1, false)); qty.appendChild(qn); qty.appendChild(mk("+", "Ajouter un exemplaire de", 1, it.qte >= QTY_MAX));
        var line = doc.createElement("div"); line.className = "cart-line";
        line.textContent = money(it.prix * it.qte);
        var rm = doc.createElement("button"); rm.type = "button"; rm.className = "rm"; rm.textContent = "Retirer";
        rm.setAttribute("aria-label", "Retirer " + it.nom + ", " + sizeText(it).toLowerCase() + ", du panier");
        rm.addEventListener("click", function () { var cc = c.slice(); cc.splice(idx, 1); saveCart(cc); renderCart(idx); say(it.nom + " retiré du panier."); });
        li.appendChild(info);
        if (shop[it.id].kind === "physical") li.appendChild(qty);
        else li.appendChild(qn);
        li.appendChild(line); li.appendChild(rm); groups[shop[it.id].kind].appendChild(li);
      });
      Object.values(groups).forEach(function (list) { list.parentElement.hidden = !list.children.length; });
      var physical = groups.physical.children.length > 0;
      var deliveryRow = one("[data-delivery-row]");
      if (deliveryRow) deliveryRow.hidden = !physical;
      updateCount(c);
      cartEmpty.hidden = c.length > 0; cartForm.hidden = c.length === 0; cartList.hidden = c.length === 0;
      var known = c.length > 0 && !unpriced;
      var put = function (sel, v) { var el = one(sel); if (el) el.textContent = v; };
      put("[data-cart-total-n]", n);
      put("[data-cart-total]", c.length === 0 ? money(0) : money(total));
      all("[data-tax-row]").forEach(function (r) { r.hidden = !known; });
      var ship = physical ? shipCost(physTotal) : 0, base = cents(total + ship);
      var tps = cents(base * TPS), tvq = cents(base * TVQ);
      put("[data-cart-ship]", ship === 0 ? "Gratuite" : fmt2.format(ship));
      var prog = one("[data-ship-progress]");
      if (prog) {
        prog.hidden = !physical;
        var pg = one("progress", prog), msg = one("[data-ship-text]", prog);
        if (pg) pg.value = Math.min(physTotal, SHIP_FREE);
        if (msg) msg.textContent = physTotal >= SHIP_FREE ? "Livraison gratuite sur tes vêtements et accessoires." : "Plus que " + money(cents(SHIP_FREE - physTotal)) + " d’achats avant taxes pour la livraison gratuite.";
      }
      if (known) { put("[data-cart-tps]", fmt2.format(tps)); put("[data-cart-tvq]", fmt2.format(tvq)); put("[data-cart-ttc]", fmt2.format(cents(base + tps + tvq))); }
      if (focusIdx != null) {
        var rows = all(".cart-item", cartList);
        var row = rows[Math.min(focusIdx, rows.length - 1)];
        var b = row ? one(".qty button:not([disabled]), .rm", row) : one("a", cartEmpty);
        if (b) b.focus();
      }
    };
    cartForm.addEventListener("submit", function (event) {
      event.preventDefault();
      if (loadCart().some(function (it) { return shop[it.id]; })) __L.href = "commande.html";
    });
    renderCart();
    var cartBusy = one("[data-cart-loading]"), cartError = one("[data-cart-error]");
    if (cartBusy) cartBusy.hidden = true;
    if (!Object.keys(shop).length && cartError) { cartError.hidden = false; cartEmpty.hidden = true; cartForm.hidden = true; cartList.hidden = true; }
    window.addEventListener("storage", function (e) { if (e.key === KEY) renderCart(); });
  }

  (function () {
  // ---- Commande, confirmation et accès aux formations ----
  // Paiement : en mode test (config.js : paiement.mode), il est simulé. Seules deux cartes de test existent et aucun numéro
  // de carte n'est conservé. Les commandes restent dans ce navigateur : le site n'a pas de serveur.
  var PAY = C.paiement || {};
  var ORDERS_KEY = "px-orders", PROGRESS_KEY = "px-progress", ACCESS_KEY = "px-demo-courses";
  var CARD_OK = "4242424242424242", CARD_DECLINED = "4000000000000002";
  function jsonKey(key, fallback) {
    try { var v = JSON.parse(sget(key)); return v == null ? fallback : v; } catch (e) { return fallback; }
  }
  function loadOrders() { var o = jsonKey(ORDERS_KEY, []); return Array.isArray(o) ? o : []; }
  function unlockedIds() { var a = jsonKey(ACCESS_KEY, []); return Array.isArray(a) ? a : []; }
  function lineTotal(it) { return cents(it.prix * it.qte); }
  function totalsOf(items) {
    var sub = 0, phys = 0;
    items.forEach(function (it) { sub += it.prix * it.qte; if (it.kind === "physical") phys += it.prix * it.qte; });
    sub = cents(sub); phys = cents(phys);
    var ship = shipCost(phys), base = cents(sub + ship);
    var tps = cents(base * TPS), tvq = cents(base * TVQ);
    return { sub: sub, ship: ship, tps: tps, tvq: tvq, total: cents(base + tps + tvq) };
  }
  function sumText(t, key) {
    if (key === "ship") return !t.ship ? "Gratuite" : money(t.ship);
    return money(t[key]);
  }
  function sizeLabel(it) {
    return it.kind === "course" ? "Formation en ligne" : it.taille === "Taille unique" ? "Taille unique" : "Taille " + it.taille;
  }
  function el(tag, cls, text) {
    var n = doc.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function fillLines(container, items) {
    container.replaceChildren();
    items.forEach(function (it) {
      var li = el("li"), name = el("span", "ln-name"), price = el("span", "ln-price", money(lineTotal(it)));
      name.appendChild(el("strong", null, it.qte > 1 ? it.qte + " × " + it.nom : it.nom));
      name.appendChild(el("small", null, sizeLabel(it)));
      li.append(name, price);
      container.appendChild(li);
    });
  }
  function fillTotals(t, physical) {
    all("[data-sum]").forEach(function (n) { n.textContent = sumText(t, n.getAttribute("data-sum")); });
    all("[data-pay-total]").forEach(function (n) { n.textContent = money(t.total); });
    all("[data-has-physical]").forEach(function (n) { n.hidden = !physical; });
  }

  // --- Page de commande
  var checkout = doc.getElementById("checkout-form");
  if (checkout) {
    var shopC = readJson("boutique-catalogue") || {};
    var cItems = loadCart().filter(function (it) { return shopC[it.id]; });
    cItems.forEach(function (it) { it.nom = shopC[it.id].nom; it.prix = shopC[it.id].prix; it.kind = shopC[it.id].kind; });
    var cLoading = one("[data-checkout-loading]"), cEmpty = one("[data-checkout-empty]"), cUnpriced = one("[data-checkout-unpriced]");
    var summaryBox = one("[data-error-summary]", checkout), payBtn = one("[data-pay]", checkout), payLabel = one("[data-pay-label]", checkout);
    var physicalC = cItems.some(function (it) { return it.kind === "physical"; });
    var unpricedC = cItems.some(function (it) { return it.prix == null; });
    if (cLoading) cLoading.hidden = true;
    if (!cItems.length) { cEmpty.hidden = false; }
    else if (unpricedC) { if (cUnpriced) cUnpriced.hidden = false; else __L.href = "panier.html"; }
    else {
      checkout.hidden = false;
      all("[data-summary]").forEach(function (box) { fillLines(one("[data-summary-lines]", box), cItems); });
      var tot = totalsOf(cItems);
      fillTotals(tot, physicalC);
      var ship = one("[data-fieldset-livraison]", checkout);
      if (ship) {
        ship.hidden = !physicalC;
        all("input, select", ship).forEach(function (f) { f.disabled = !physicalC; f.required = physicalC && f.name !== "adresse2"; });
      }
      var isLive = PAY.mode === "live";
      all("[data-paiement-test]").forEach(function (n) { n.hidden = isLive; });
      var card = checkout.elements.carte, exp = checkout.elements.expiration, cvc = checkout.elements.cvc;
      if (card) {
        card.addEventListener("input", function () {
          var d = card.value.replace(/\D/g, "").slice(0, 16);
          card.value = d.replace(/(.{4})/g, "$1 ").trim();
        });
        exp.addEventListener("input", function () {
          var d = exp.value.replace(/\D/g, "").slice(0, 4);
          exp.value = d.length > 2 ? d.slice(0, 2) + "/" + d.slice(2) : d;
        });
        cvc.addEventListener("input", function () { cvc.value = cvc.value.replace(/\D/g, "").slice(0, 3); });
      }
      var RULES = {
        prenom: function (v) { return v.trim() ? "" : "Entre ton prénom."; },
        nom: function (v) { return v.trim() ? "" : "Entre ton nom."; },
        courriel: function (v) { return !v.trim() ? "Entre ton adresse courriel." : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? "" : "L’adresse courriel semble incomplète. Exemple : nom@exemple.com."; },
        adresse: function (v) { return v.trim() ? "" : "Entre ton adresse de livraison."; },
        ville: function (v) { return v.trim() ? "" : "Entre ta ville."; },
        province: function (v) { return v ? "" : "Choisis ta province ou ton territoire."; },
        postal: function (v) { return /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/.test(v.trim()) ? "" : "Entre un code postal canadien valide. Exemple : H2X 1Y4."; },
        carte: function (v) {
          var d = v.replace(/\D/g, "");
          if (!d) return "Entre le numéro de carte.";
          if (d.length !== 16) return "Le numéro de carte compte 16 chiffres.";
          return d === CARD_OK || d === CARD_DECLINED ? "" : "En mode test, utilise l’une des deux cartes de test indiquées. N’entre jamais une vraie carte.";
        },
        expiration: function (v) {
          var m = /^(\d{2})\/(\d{2})$/.exec(v.trim());
          if (!m) return "Entre la date d’expiration au format MM/AA.";
          var month = Number(m[1]), year = 2000 + Number(m[2]), now = new Date();
          if (month < 1 || month > 12) return "Le mois d’expiration doit être entre 01 et 12.";
          return year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1) ? "Cette carte est expirée. Entre une date future." : "";
        },
        cvc: function (v) { return /^\d{3}$/.test(v) ? "" : "Le code de sécurité compte 3 chiffres."; },
        cgv: function (v, f) { return f.checked ? "" : "Accepte les conditions de vente pour continuer."; }
      };
      var errorOf = function (f) {
        var rule = RULES[f.name === "code_postal" ? "postal" : f.name];
        return rule && !f.disabled && !f.closest("[hidden]") ? rule(f.value, f) : "";
      };
      var setError = function (f, msg) {
        var box = doc.getElementById(f.id + "-err");
        f.setAttribute("aria-invalid", msg ? "true" : "false");
        if (box) { box.textContent = msg; box.hidden = !msg; }
        if (msg) f.setAttribute("aria-describedby", f.id + "-err"); else f.removeAttribute("aria-describedby");
      };
      var fieldsC = all("input[id], select[id]", checkout).filter(function (f) { return f.type !== "hidden"; });
      fieldsC.forEach(function (f) {
        f.addEventListener("blur", function () { if (f.value || f.getAttribute("aria-invalid") === "true") setError(f, errorOf(f)); });
        f.addEventListener("input", function () { if (f.getAttribute("aria-invalid") === "true") setError(f, errorOf(f)); });
        f.addEventListener("change", function () { if (f.getAttribute("aria-invalid") === "true") setError(f, errorOf(f)); });
      });
      var validateAll = function () {
        var errs = [];
        fieldsC.forEach(function (f) {
          var msg = errorOf(f);
          setError(f, msg);
          if (msg) errs.push({ field: f, msg: msg });
        });
        return errs;
      };
      var showSummary = function (errs) {
        summaryBox.replaceChildren();
        var h = el("p", null, errs.length > 1 ? errs.length + " informations à corriger avant de payer :" : "1 information à corriger avant de payer :");
        h.className = "err-title";
        var ul = el("ul");
        errs.forEach(function (e) {
          var li = el("li"), a = el("a", null, e.msg);
          a.href = "#" + e.field.id;
          a.addEventListener("click", function (ev) { ev.preventDefault(); e.field.focus(); });
          li.appendChild(a); ul.appendChild(li);
        });
        summaryBox.append(h, ul);
        summaryBox.hidden = false;
        summaryBox.focus();
      };
      var busy = false;
      var orderId = function () {
        var d = new Date(), pad = function (n) { return String(n).padStart(2, "0"); };
        var known = loadOrders().map(function (o) { return o.id; }), id;
        do {
          id = "RX-" + String(d.getFullYear()).slice(2) + pad(d.getMonth() + 1) + pad(d.getDate()) + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
        } while (known.indexOf(id) !== -1);
        return id;
      };
      checkout.addEventListener("submit", function (event) {
        event.preventDefault();
        if (busy) return;
        summaryBox.hidden = true;
        var s0 = one(".form-status", checkout); if (s0) s0.hidden = true;
        var errs = validateAll();
        if (errs.length) { showSummary(errs); return; }
        busy = true;
        payBtn.disabled = true; payBtn.setAttribute("aria-busy", "true");
        payLabel.textContent = "Paiement en cours…";
        status(checkout, "ok", "Paiement en cours… Ne ferme pas cette page.");
        var digits = card ? card.value.replace(/\D/g, "") : "";
        setTimeout(function () {
          var release = function () {
            busy = false; payBtn.disabled = false; payBtn.removeAttribute("aria-busy");
            payLabel.textContent = "Payer";
          };
          if (digits === CARD_DECLINED) {
            release();
            if (card) { card.value = ""; exp.value = ""; cvc.value = ""; }
            status(checkout, "error", "Paiement refusé par l’émetteur de la carte (carte de test refusée). Aucun montant n’a été prélevé et ton panier est conservé. Utilise la carte de test acceptée ou une autre carte.");
            if (card) card.focus();
            return;
          }
          var f = checkout.elements, client = { prenom: f.prenom.value.trim(), nom: f.nom.value.trim(), courriel: f.courriel.value.trim() };
          if (physicalC) client.livraison = { adresse: f.adresse.value.trim(), adresse2: f.adresse2 ? f.adresse2.value.trim() : "", ville: f.ville.value.trim(), province: f.province.value, postal: f.code_postal.value.trim().toUpperCase() };
          var order = {
            id: orderId(), date: new Date().toISOString(), mode: PAY.mode === "live" ? "live" : "test",
            articles: cItems.map(function (it) { return { id: it.id, nom: it.nom, taille: it.taille, qte: it.qte, prix: it.prix, kind: it.kind }; }),
            totaux: totalsOf(cItems), client: client, paiement: { carte: "•••• " + digits.slice(-4), statut: "accepté" }
          };
          if (card) { card.value = ""; exp.value = ""; cvc.value = ""; }
          try {
            var orders = loadOrders(); orders.push(order); sset(ORDERS_KEY, JSON.stringify(orders));
            var courses = order.articles.filter(function (a) { return a.kind === "course"; }).map(function (a) { return a.id; });
            if (courses.length) sset(ACCESS_KEY, JSON.stringify(Array.from(new Set(unlockedIds().concat(courses)))));
            saveCart([]);
          } catch (err) {
            release();
            status(checkout, "error", "Le navigateur n’a pas pu enregistrer ta commande. Aucun montant n’a été prélevé. Vérifie que le stockage du navigateur est autorisé, puis réessaie.");
            return;
          }
          __L.href = "confirmation.html?commande=" + encodeURIComponent(order.id);
        }, 900);
      });
    }
  }

  // --- Page de confirmation
  var confirmation = one("[data-confirmation]");
  if (confirmation) {
    var wantedId = params.get("commande"), order = loadOrders().filter(function (o) { return o.id === wantedId; })[0];
    var shopV = readJson("boutique-catalogue") || {};
    var confTitle = one("[data-conf-title]", confirmation);
    if (!order) {
      confTitle.textContent = "Commande introuvable";
      one("[data-conf-missing]").hidden = false;
    } else {
      one("[data-conf-ok]").hidden = false;
      confTitle.textContent = "Merci, " + order.client.prenom + ".";
      all("[data-conf-numero]").forEach(function (n) { n.textContent = order.id; });
      all("[data-conf-date]").forEach(function (n) { n.textContent = new Date(order.date).toLocaleDateString("fr-CA", { year: "numeric", month: "long", day: "numeric" }); });
      all("[data-conf-courriel]").forEach(function (n) { n.textContent = order.client.courriel; });
      all("[data-conf-carte]").forEach(function (n) { n.textContent = order.paiement.carte; });
      fillLines(one("[data-summary-lines]", confirmation), order.articles);
      all("[data-sum]", confirmation).forEach(function (n) { n.textContent = sumText(order.totaux, n.getAttribute("data-sum")); });
      var courseLines = order.articles.filter(function (a) { return a.kind === "course"; });
      var physLines = order.articles.filter(function (a) { return a.kind === "physical"; });
      all("[data-has-physical]", confirmation).forEach(function (n) { n.hidden = !physLines.length; });
      one("[data-conf-access]").hidden = !courseLines.length;
      one("[data-conf-livraison]").hidden = !physLines.length;
      if (courseLines.length) {
        var first = courseLines[0];
        var go = one("[data-conf-access-link]");
        go.href = "mes-formations.html#" + first.id;
        go.textContent = courseLines.length > 1 ? "Accéder à mes formations" : "Accéder à ma formation";
        var names = one("[data-conf-courses]"); names.replaceChildren();
        courseLines.forEach(function (a) { names.appendChild(el("li", null, a.nom)); });
      }
      if (physLines.length && order.client.livraison) {
        var L = order.client.livraison;
        one("[data-conf-adresse]").textContent = [order.client.prenom + " " + order.client.nom, L.adresse + (L.adresse2 ? ", " + L.adresse2 : ""), L.ville + " (" + L.province + ") " + L.postal].join("\n");
      }
      var printBtn = one("[data-print]");
      if (printBtn) printBtn.addEventListener("click", function () { window.print(); });
      doc.title = "Commande " + order.id + " confirmée | RUNAX";
      confTitle.focus();
    }
  }

  // --- Mes formations : accès, leçons et progression
  var library = one("[data-course-library]");
  if (library) {
    var mine = unlockedIds(), progress = jsonKey(PROGRESS_KEY, {}), orders = loadOrders();
    var cards = all("[data-unlocked-course]", library);
    var refresh = function (card) {
      var boxes = all("input[data-lesson]", card), done = boxes.filter(function (b) { return b.checked; }).length;
      var label = one("[data-progress-text]", card), bar = one("progress", card);
      if (label) label.textContent = done + " sur " + boxes.length + (boxes.length > 1 ? " leçons terminées" : " leçon terminée");
      if (bar) { bar.max = boxes.length; bar.value = done; }
    };
    cards.forEach(function (card) {
      var id = card.getAttribute("data-unlocked-course");
      card.hidden = mine.indexOf(id) === -1;
      all("input[data-lesson]", card).forEach(function (box) {
        box.checked = !!progress[box.getAttribute("data-lesson")];
        box.addEventListener("change", function () {
          progress[box.getAttribute("data-lesson")] = box.checked;
          sset(PROGRESS_KEY, JSON.stringify(progress));
          refresh(card);
          say(box.checked ? "Leçon marquée comme terminée." : "Leçon marquée comme à faire.");
        });
      });
      refresh(card);
    });
    var empty = one("[data-library-empty]");
    if (empty) empty.hidden = mine.length > 0;
    var ordersBox = one("[data-orders]");
    if (ordersBox) {
      var list = one("ul", ordersBox);
      var mineOrders = orders.filter(function (o) { return o.articles.some(function (a) { return a.kind === "course"; }); });
      ordersBox.hidden = !mineOrders.length;
      mineOrders.slice().reverse().forEach(function (o) {
        var li = el("li"), a = el("a", null, "Commande " + o.id);
        a.href = "confirmation.html?commande=" + encodeURIComponent(o.id);
        li.append(a, doc.createTextNode(" · " + new Date(o.date).toLocaleDateString("fr-CA", { year: "numeric", month: "long", day: "numeric" }) + " · " + money(o.totaux.total)));
        list.appendChild(li);
      });
    }
    if (__L.hash && mine.indexOf(__L.hash.slice(1)) !== -1) {
      var target = doc.getElementById(__L.hash.slice(1));
      if (target) { var det = one("details", target); if (det) det.open = true; }
    }
  }
    })();

  (function () {
    // ---- Page Outils : calculateur d'allure → solution recommandée → réservation, et séance guidée ----
    var root = one("[data-outils]");
    if (!root) return;
    var K = {"prix": {"plan": 49, "avance": 109, "total": 199, "f5": 39, "f10": 59, "semi": 79, "tech": 45, "atelier": 35, "groupe10": 149}, "club": {"jour": "", "jourIdx": -1, "h": null, "min": null, "heure": "horaire communiqué aux inscrits", "lieu": "Montréal", "places": 20, "duree": "60 minutes"}, "atelier": {"places": 8}, "groupe10": {"places": 12}};
    var NB = " ", reduce = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    function pad(n) { return String(n).padStart(2, "0"); }
    function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
    function cad(n) { return n + NB + "$" + NB + "CA"; }
    function fmtTime(sec) { sec = Math.round(sec); var h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60; return h ? h + ":" + pad(m) + ":" + pad(s) : m + ":" + pad(s); }
    function fmtPace(sec) { sec = Math.round(sec); return Math.floor(sec / 60) + ":" + pad(sec % 60); }
    function fmtNum(x, d) { return x.toFixed(d).replace(".", ","); }
    function checked(form, name) { var el = one("input[name=" + name + "]:checked", form); return el ? el.value : ""; }
    function go(el) { if (el && el.scrollIntoView) el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }); }
    function has(fam) { return FAM[fam] !== false; }

    // ------------------------------------------------------------------------------------------ état commun
    var S = { km: 5, seconds: 1800, pace: 360, p10: 375, calculated: false, summary: "", vise: 5, viseTouched: false, goal: "premiere", support: "seul", touched: false, main: null };
    var NOMS = { "5": "5 km", "10": "10 km", "21.0975": "Semi-marathon", "42.195": "Marathon" };
    var DISTS = [5, 10, 21.0975, 42.195];

    // ------------------------------------------------------------------------------------------ 1. calculateur
    var calc = one("[data-calc]", root), calcOut = one("[data-calc-out]", root), live = one("[data-calc-live]", root), calcErr = one("[data-calc-error]", root);
    function predict(sec, km, to) { return sec * Math.pow(to / km, 1.06); }
    function readCalc() {
        var f = calc.elements, kind = checked(calc, "distance") || "5";
        var km = kind === "autre" ? Number(String(f.km.value).replace(",", ".")) : Number(kind);
        var h = Number(f.h.value) || 0, m = Number(f.m.value) || 0, s = Number(f.s.value) || 0;
        return { km: km, h: h, m: m, s: s, seconds: h * 3600 + m * 60 + s, kind: kind };
    }
    function checkCalc(v) {
        if (!(v.km >= 0.4 && v.km <= 100)) return "Entre une distance comprise entre 0,4 et 100 km.";
        if (v.h < 0 || v.m < 0 || v.s < 0 || v.m > 59 || v.s > 59) return "Les minutes et les secondes vont de 0 à 59.";
        if (!(v.seconds >= 60)) return "Entre un temps d’au moins une minute.";
        var pace = v.seconds / v.km;
        if (pace < 120) return "Cette allure dépasse 30 km/h : vérifie ta distance et ton temps.";
        if (pace > 1200) return "Cette allure est plus lente que la marche : vérifie ta distance et ton temps.";
        return "";
    }
    var ZONES = [
        { cls: "z1", nom: "Facile", a: 1.20, b: 1.35, sens: "Tu parles en phrases complètes" },
        { cls: "z2", nom: "Soutenue", a: 1.04, b: 1.08, sens: "Quelques mots à la fois" },
        { cls: "z3", nom: "Allure 10 km", a: 1.0, b: 1.0, sens: "Exigeant, mais contrôlé" },
        { cls: "z4", nom: "Vive", a: 0.94, b: 0.97, sens: "Dur : tu comptes les secondes" }
    ];
    function renderCalc(animate) {
        var pace = S.pace, kmh = 3600 / pace, rows = [];
        var same = DISTS.some(function (d) { return Math.abs(d - S.km) < 0.01; });
        var list = DISTS.map(function (d) { return { d: d, nom: NOMS[String(d)], you: Math.abs(d - S.km) < 0.01 }; });
        if (!same) list.push({ d: S.km, nom: fmtNum(S.km, S.km % 1 ? 1 : 0) + " km", you: true });
        list.sort(function (a, b) { return a.d - b.d; });
        list.forEach(function (e) {
            var t = e.you ? S.seconds : predict(S.seconds, S.km, e.d);
            rows.push('<tr' + (e.you ? ' class="is-you"' : "") + '><th scope="row">' + esc(e.nom) + '</th><td>' + fmtTime(t) + (e.you ? "" : "*") + '</td><td>' + fmtPace(t / e.d) + ' /km</td></tr>');
        });
        var zones = ZONES.map(function (z) {
            var lo = S.p10 * Math.min(z.a, z.b), hi = S.p10 * Math.max(z.a, z.b);
            var txt = z.a === z.b ? fmtPace(lo) : fmtPace(lo) + "–" + fmtPace(hi);
            return '<li class="rx-zone ' + z.cls + '"><b>' + z.nom + '</b><strong>' + txt + ' <small>/km</small></strong><small>' + z.sens + '</small></li>';
        });
        calcOut.innerHTML =
            (S.calculated ? "" : '<p class="rx-example">Exemple : 5 km en 30 minutes. Entre tes chiffres pour voir les tiens.</p>') +
            '<div class="rx-pace"><span class="rx-pace-label">Ton allure</span><strong class="rx-pace-val">' + fmtPace(pace) + '<small>/km</small></strong>' +
            '<p class="rx-pace-meta"><span><b>' + fmtNum(kmh, 1) + '</b> km/h</span><span><b>' + fmtTime(S.seconds) + '</b> sur ' + esc(fmtNum(S.km, S.km % 1 ? 1 : 0)) + ' km</span></p></div>' +
            '<div><h3 class="rx-out-h">Sur d’autres distances</h3><table class="rx-proj"><caption class="sr">Temps et allure estimés selon ton résultat</caption><thead class="sr"><tr><th scope="col">Distance</th><th scope="col">Temps</th><th scope="col">Allure</th></tr></thead><tbody>' + rows.join("") + '</tbody></table>' +
            '<p class="fine">* Estimation (formule de Riegel) : elle suppose une préparation adaptée à la distance. Le marathon se prépare sur mesure.</p></div>' +
            '<div><h3 class="rx-out-h">Tes allures d’entraînement</h3><ul class="rx-zones">' + zones.join("") + '</ul>' +
            '<p class="fine">Des repères établis à partir de ton temps. Ton souffle et tes sensations décident : en coaching, Alexandre ajuste ces allures avec tes retours.</p></div>' +
            '<div class="rx-calc-next"><a class="btn btn--primary" href="#solution">Voir ma solution</a><button type="button" class="btn btn--ghost" data-reserve="appel">Réserver mon appel</button></div>';
        live.textContent = "Allure : " + Math.floor(pace / 60) + " minutes " + Math.round(pace % 60) + " secondes par kilomètre. Vitesse : " + fmtNum(kmh, 1) + " kilomètres à l’heure.";
        if (animate && !reduce) { calcOut.classList.remove("rx-result-in"); void calcOut.offsetWidth; calcOut.classList.add("rx-result-in"); }
    }
    function applyCalc(v, user) {
        S.km = v.km; S.seconds = v.seconds; S.pace = v.seconds / v.km;
        S.p10 = predict(v.seconds, v.km, 10) / 10;
        S.calculated = S.calculated || !!user;
        S.summary = fmtNum(v.km, v.km % 1 ? 1 : 0) + " km en " + fmtTime(v.seconds) + " (" + fmtPace(S.pace) + "/km) · 10 km estimé " + fmtTime(predict(v.seconds, v.km, 10)) + " · allure facile " + fmtPace(S.p10 * 1.2) + "–" + fmtPace(S.p10 * 1.35) + "/km";
        if (!S.viseTouched) {
            S.vise = v.km <= 7.5 ? 5 : v.km <= 15 ? 10 : v.km <= 30 ? 21 : 42;
            var chip = one("input[name=vise][value='" + S.vise + "']", root);
            if (chip) chip.checked = true;
        }
        renderCalc(user);
        renderSolution();
        syncRes();
    }
    function submitCalc(user) {
        var v = readCalc(), err = checkCalc(v);
        calcErr.hidden = !err; calcErr.textContent = err;
        all("input[type=number]", calc).forEach(function (i) { i.setAttribute("aria-invalid", err ? "true" : "false"); });
        if (err) return false;
        applyCalc(v, user);
        return true;
    }
    if (calc && calcOut) {
        var custom = one("[data-calc-custom]", calc);
        all("input[name=distance]", calc).forEach(function (r) {
            r.addEventListener("change", function () {
                custom.hidden = checked(calc, "distance") !== "autre";
                if (!custom.hidden) calc.elements.km.focus();
                else submitCalc(true);
            });
        });
        calc.addEventListener("submit", function (e) { e.preventDefault(); if (submitCalc(true) && window.innerWidth < 980) go(calcOut); });
        all("input[type=number]", calc).forEach(function (i) { i.addEventListener("change", function () { submitCalc(true); }); });
        calc.elements.h.addEventListener("input", function () { calcErr.hidden = true; });
        submitCalc(false);
    }

    // ------------------------------------------------------------------------------------------ 2. solution
    var solForm = one("[data-solution]", root), solOut = one("[data-solution-out]", root);
    var CARTES = {
        f5d: { kind: "formation", fam: "formations-en-ligne", tag: "Formation autonome", titre: "Préparation 5 km · Début et reprise", prix: cad(K.prix.f5), unite: "une seule fois · accès illimité",
               points: ["8 semaines, 3 séances par semaine, de 25 à 35 minutes", "3 leçons écrites et le plan semaine par semaine", "Marche et course en alternance, sans chrono de référence"], href: "formations.html#premier-5-km", court: "Huit semaines pour installer ta routine et terminer ton premier 5 km." },
        f5c: { kind: "formation", fam: "formations-en-ligne", tag: "Formation autonome", titre: "Préparation 5 km · Améliorer mon chrono", prix: cad(K.prix.f5), unite: "une seule fois · accès illimité",
               points: ["6 semaines, 3 séances par semaine, de 25 à 40 minutes", "Intervalles à effort contrôlé et semaine d’allègement", "3 leçons écrites, séances types et glossaire"], href: "formations.html#chrono-5-km", court: "Six semaines pour travailler tes intervalles et ton départ." },
        f10p: { kind: "formation", fam: "formations-en-ligne", tag: "Formation autonome", titre: "Préparation 10 km · Mon premier 10 km", prix: cad(K.prix.f10), unite: "une seule fois · accès illimité",
                points: ["10 semaines, 3 séances par semaine, de 25 à 60 minutes", "Sortie longue qui s’allonge pas à pas", "3 leçons, plan complet, stratégie de course"], href: "formations.html#premier-10-km", court: "Dix semaines pour franchir tes premiers 10 km." },
        f10c: { kind: "formation", fam: "formations-en-ligne", tag: "Formation autonome", titre: "Préparation 10 km · Améliorer mon chrono", prix: cad(K.prix.f10), unite: "une seule fois · accès illimité",
                points: ["8 semaines, 4 séances par semaine, de 30 à 75 minutes", "Intervalles, allure cible et récupération", "3 leçons, plan complet, glossaire"], href: "formations.html#chrono-10-km", court: "Huit semaines d’intervalles et d’allure cible pour un nouveau chrono." },
        semi: { kind: "formation", fam: "formations-en-ligne", tag: "Formation autonome", titre: "Préparer un semi-marathon", prix: cad(K.prix.semi), unite: "une seule fois · accès illimité",
                points: ["12 semaines, 4 séances par semaine", "Sorties longues jusqu’à 18 km, affûtage", "3 leçons : structure, sorties longues, jour de course"], href: "formations.html#course-semi", court: "Douze semaines, de 10 km à ton semi-marathon." },
        tech: { kind: "formation", fam: "formations-en-ligne", tag: "Formation autonome", titre: "Technique de course", prix: cad(K.prix.tech), unite: "une seule fois · accès illimité",
                points: ["6 semaines, 2 séances techniques de 20 minutes", "Observer ta foulée, travailler les appuis, intégrer les éducatifs", "3 leçons et un plan semaine par semaine"], href: "formations.html#course-technique", court: "Six semaines pour une foulée plus légère et plus régulière." },
        plan: { kind: "coaching", fam: "coaching-offres", tag: "Avec Alexandre", titre: "Plan mensuel", prix: cad(K.prix.plan), unite: "par mois · sans engagement",
                points: ["Un plan de 4 semaines écrit à la main chaque mois", "Une révision par mois, à partir de tes retours", "Échanges par courriel, réponse sous 2 jours ouvrables"], href: "inscription.html?formule=plan", court: "Un plan écrit pour toi, révisé chaque mois." },
        avance: { kind: "coaching", fam: "coaching-offres", tag: "Avec Alexandre", titre: "Suivi avancé", prix: cad(K.prix.avance), unite: "par mois · sans engagement",
                  points: ["Un ajustement de ton plan chaque semaine", "Réponse sous 24 h ouvrables et un appel vidéo de 30 minutes par mois", "Bilan mensuel de ta progression"], href: "inscription.html?formule=avance", court: "Ton plan ajusté chaque semaine, avec un appel par mois." },
        club: { kind: "club", fam: "club", tag: "En groupe", titre: "Sortie du Club RUNAX", prix: "Gratuit", unite: "chaque " + K.club.jour + " à " + K.club.heure + " · " + K.club.lieu,
                points: ["Trois groupes d’allure, " + K.club.places + " personnes au plus", K.club.duree + ", menées par Alexandre ou son équipe", "Aucune expérience de groupe nécessaire"], reserve: "club", href: "groupes.html#sortie-hebdomadaire", court: "Une sortie footing d’environ 1 h par semaine, 19,98 $/mois avant taxes." },
        atelier: { kind: "club", fam: "club", tag: "En groupe", titre: "Atelier technique", prix: cad(K.prix.atelier), unite: "par personne · " + K.atelier.places + " places",
                   points: ["Date et lieu communiqués aux inscrits", "Alexandre montre les gestes, tu les essaies sur piste", "Un retour sur ta foulée"], reserve: "atelier", href: "groupes.html#atelier-technique", court: "Un atelier en petit groupe, sur piste, avec retour sur ta foulée." },
        groupe10: { kind: "club", fam: "club", tag: "En groupe", titre: "Préparation 10 km en groupe", prix: cad(K.prix.groupe10), unite: "pour dix semaines · " + K.groupe10.places + " places",
                    points: ["Une séance encadrée chaque " + K.club.jour + " à " + K.club.heure, "Un plan écrit pour les autres séances", "Une nouvelle cohorte en janvier, avril, juillet et octobre"], href: "groupes.html#groupe-10-km", court: "Une séance de groupe par semaine et un plan écrit, sur dix semaines." }
    };
    var BUTS = { premiere: "terminer ta première distance", chrono: "améliorer ton chrono", reprise: "reprendre en douceur", technique: "travailler ta technique" };
    var VISEES = { "5": "le 5 km", "10": "le 10 km", "21": "le semi-marathon", "42": "le marathon", "0": "une autre distance" };
    function formationFor(goal, vise) {
        if (goal === "technique") return "tech";
        if (vise === 5) return goal === "chrono" ? "f5c" : "f5d";
        if (vise === 10) return goal === "chrono" ? "f10c" : "f10p";
        if (vise === 21) return "semi";
        return null;
    }
    function tierFor(goal, vise) { return goal === "chrono" || vise >= 21 || vise === 0 ? "avance" : "plan"; }
    function clubFor(goal, vise) { return goal === "technique" ? "atelier" : vise === 10 && goal !== "reprise" ? "groupe10" : "club"; }
    function pick() {
        var g = S.goal, v = S.vise, f = formationFor(g, v), t = tierFor(g, v), c = clubFor(g, v);
        var by = { seul: f || t, alexandre: t, groupe: c };
        var order = ["seul", "alexandre", "groupe"], main = by[S.support], alts = [];
        order.forEach(function (k) { if (k !== S.support && by[k] !== main && alts.indexOf(by[k]) < 0) alts.push(by[k]); });
        return { key: main, alts: alts, sansFormation: S.support === "seul" && !f };
    }
    function why(card, sans) {
        var avant = S.calculated ? "Tu cours " + fmtNum(S.km, S.km % 1 ? 1 : 0) + " km en " + fmtTime(S.seconds) + ", soit " + fmtPace(S.pace) + " par kilomètre. " : "";
        var but = BUTS[S.goal] + " sur " + VISEES[String(S.vise)];
        if (sans) return avant + "Pour " + but + ", il n’existe pas de formation en ligne : cette distance se prépare sur mesure. Alexandre écrit ton plan et l’ajuste avec toi.";
        if (card.kind === "formation") return avant + "Pour " + but + ", c’est le chemin le plus court : un plan écrit, des leçons et un accès illimité, à ton rythme.";
        if (card.kind === "coaching") return avant + "Pour " + but + ", Alexandre écrit ton plan et l’ajuste avec tes retours. Tu paies au mois.";
        return avant + "Pour " + but + ", courir en groupe t’aide à rester régulier. Tu choisis ta date, Alexandre confirme ta place.";
    }
    function cta(c, level) {
        var cls = level === 0 ? "btn btn--primary" : level === 1 ? "btn btn--dark" : "btn btn--ghost";
        if (c.reserve) return '<button type="button" class="' + cls + '" data-reserve="' + c.reserve + '">' + esc(c.label) + '</button>';
        return '<a class="' + cls + '" href="' + esc(c.href) + '">' + esc(c.label) + '</a>';
    }
    function ctasFor(card, main) {
        if (!main) return [cta(card.reserve ? { label: card.kind === "club" ? "Réserver ma place" : "Réserver", reserve: card.reserve } : { label: "Voir cette solution", href: card.href }, 2)];
        if (card.kind === "formation") return [cta({ label: "Voir la formation · " + card.prix, href: card.href }, 0), cta({ label: "En parler avec Alexandre", reserve: "appel" }, 2)];
        if (card.kind === "coaching") return [cta({ label: "Réserver mon appel découverte", reserve: "appel" }, 0), cta({ label: "Voir les formules", href: "coaching.html#comparatif" }, 2)];
        return [cta({ label: card.reserve === "atelier" ? "Réserver ma place à l’atelier" : "Réserver ma place", reserve: card.reserve || "club" }, 0), cta({ label: "En savoir plus", href: card.href }, 2)];
    }
    function cardHtml(key, main, sans) {
        var c = CARTES[key];
        var h = '<article class="rx-sol-card ' + (main ? "rx-sol-card--main" : "rx-sol-card--alt") + '"><p class="rx-sol-tag">' + esc(main ? (sans ? "Ta solution · sur mesure" : "Ta solution") : c.tag) + '</p><h3>' + esc(c.titre) + '</h3>' +
            '<p class="rx-sol-price"><b>' + c.prix + '</b><span>' + esc(c.unite) + '</span></p>';
        if (main) h += '<p class="rx-sol-why">' + esc(why(c, sans)) + '</p><ul class="rx-sol-points">' + c.points.map(function (p) { return "<li>" + esc(p) + "</li>"; }).join("") + "</ul>";
        else h += '<p class="rx-sol-why">' + esc(c.court) + "</p>";
        return h + '<div class="actions">' + ctasFor(c, main).join("") + "</div></article>";
    }
    function renderSolution() {
        if (!solForm || !solOut) return;
        S.goal = checked(solForm, "objectif") || "premiere";
        S.support = checked(solForm, "soutien") || "seul";
        S.vise = Number(checked(solForm, "vise"));
        var p = pick();
        // une offre dont la famille n'est pas publiée n'est jamais proposée
        var main = p.key, alts = p.alts.filter(function (k) { return has(CARTES[k].fam); });
        if (!has(CARTES[main].fam)) { main = alts.shift() || "plan"; }
        S.main = main;
        solOut.innerHTML = cardHtml(main, true, p.sansFormation && main === p.key) + '<div class="rx-sol-alts">' + alts.map(function (k) { return cardHtml(k, false); }).join("") + "</div>";
        var liveS = one("[data-solution-live]", root);
        if (liveS && S.touched) liveS.textContent = "Solution proposée : " + CARTES[main].titre + ", " + CARTES[main].prix + ", " + CARTES[main].unite + ".";
        syncRes();
    }
    if (solForm && solOut) {
        all("input[name=vise]", solForm).forEach(function (i) { i.addEventListener("change", function () { S.viseTouched = true; S.touched = true; renderSolution(); }); });
        all("input[name=objectif], input[name=soutien]", solForm).forEach(function (i) { i.addEventListener("change", function () { S.touched = true; renderSolution(); }); });
        var first = one("input[name=vise][value='" + S.vise + "']", solForm); if (first) first.checked = true;
        renderSolution();
    }

    // ------------------------------------------------------------------------------------------ 3. réservation
    var res = one("[data-reservation]", root);
    var TYPES = {
        appel: { fam: "contact", label: "Appel découverte", sujet: "Réservation · Appel découverte", cta: "Réserver mon appel", apres: "Alexandre te répond par courriel dans les 24 h ouvrables pour confirmer l’heure de l’appel." },
        club: { fam: "club", label: "Sortie du Club", sujet: "Réservation · Sortie du Club", cta: "Réserver ma place", apres: "Alexandre confirme ta place par courriel dans les 24 h ouvrables." },
        atelier: { fam: "club", label: "Atelier technique", sujet: "Réservation · Atelier technique", cta: "Réserver ma place à l’atelier", apres: "Alexandre confirme ta place par courriel dans les 24 h ouvrables ; le paiement se fait après la confirmation." }
    };
    var type = "appel";
    function dateLabel(d) { var s = new Intl.DateTimeFormat("fr-CA", { weekday: "long", day: "numeric", month: "long" }).format(d); return s.charAt(0).toUpperCase() + s.slice(1); }
    function isoDay(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
    // préavis de 24 h : on ne propose que les dates encore réservables
    function nextWeekdays(weekday, hour, minute, n) {
        var out = [], limit = Date.now() + 24 * 3600 * 1000, d = new Date();
        d.setHours(0, 0, 0, 0);
        for (var i = 0; i < 120 && out.length < n; i += 1) {
            var c = new Date(d.getFullYear(), d.getMonth(), d.getDate() + i, hour, minute, 0);
            if (c.getDay() === weekday && c.getTime() >= limit) out.push(c);
        }
        return out;
    }
    function firstSaturdays(n) {
        var out = [], limit = Date.now() + 24 * 3600 * 1000, now = new Date();
        for (var m = 0; m < 14 && out.length < n; m += 1) {
            var c = new Date(now.getFullYear(), now.getMonth() + m, 1, 9, 0, 0);
            while (c.getDay() !== 6) c.setDate(c.getDate() + 1);
            if (c.getTime() >= limit) out.push(c);
        }
        return out;
    }
    function buildDates(host, dates, name) {
        if (!host) return;
        host.innerHTML = dates.map(function (d, i) {
            return '<label class="rx-chip"><input type="radio" name="' + name + '" value="' + isoDay(d) + '" data-texte="' + esc(dateLabel(d)) + '" data-nomail><span>' + esc(dateLabel(d)) + "</span></label>";
        }).join("");
        all("input", host).forEach(function (i) { i.addEventListener("change", syncRes); });
    }
    function panelState() {
        all("[data-res-panel]", res).forEach(function (p) {
            var on = p.getAttribute("data-res-panel") === type;
            p.hidden = !on;
            all("input, select, textarea", p).forEach(function (f) {
                f.disabled = !on;
                if (f.hasAttribute("data-req")) { if (on) f.setAttribute("required", ""); else f.removeAttribute("required"); }
            });
        });
        var tel = one("#res-tel", res), mod = one("#res-modalite", res);
        if (tel) {
            if (type === "appel" && mod && mod.value === "Téléphone") tel.setAttribute("required", ""); else tel.removeAttribute("required");
            var hint = one("[data-tel-hint]", res);
            if (hint) hint.textContent = type === "appel" && mod && mod.value === "Téléphone" ? "Nécessaire pour t’appeler." : "Facultatif.";
        }
    }
    function slotText() {
        var days = all("input[name='jour_ui[]']:checked", res).map(function (i) { return i.getAttribute("data-texte"); });
        var win = one("input[name=plage_ui]:checked", res);
        return days.length || win ? (days.join(", ") || "aucun jour choisi") + " · " + (win ? win.getAttribute("data-texte") : "aucune plage choisie") : "";
    }
    function syncRes() {
        if (!res) return;
        var T = TYPES[type];
        var set = function (n, v) { var el = res.elements[n]; if (el) el.value = v; };
        set("reservation", T.label);
        set("calculateur", S.calculated ? S.summary : "");
        var cardNow = S.main && S.touched ? CARTES[S.main] : null;
        set("solution", cardNow ? cardNow.titre + " (" + cardNow.prix.replace(/ /g, " ") + (cardNow.kind === "coaching" ? " par mois" : "") + ")" : "");
        set("disponibilites", type === "appel" ? slotText() : "");
        var date = one("input[name=date_" + type + "_ui]:checked", res);
        set("date_choisie", date && type !== "appel" ? date.getAttribute("data-texte") : "");
        res.setAttribute("data-sujet", T.sujet);
        res.setAttribute("data-apres", T.apres);
        var btn = one("[data-res-submit]", res); if (btn) btn.textContent = T.cta;
        var title = one("[data-res-title]", res); if (title) title.textContent = T.label;
        var recap = one("[data-recap]", res), items = [];
        if (S.calculated) items.push(["Tes chiffres", fmtNum(S.km, S.km % 1 ? 1 : 0) + " km en " + fmtTime(S.seconds) + " · " + fmtPace(S.pace) + "/km"]);
        if (cardNow) items.push(["Solution regardée", cardNow.titre]);
        if (type === "appel" && slotText()) items.push(["Disponibilités", slotText()]);
        if (type !== "appel" && date) items.push(["Date", date.getAttribute("data-texte")]);
        if (recap) { recap.innerHTML = items.map(function (it) { return "<dt>" + esc(it[0]) + "</dt><dd>" + esc(it[1]) + "</dd>"; }).join(""); recap.hidden = !items.length; }
    }
    function setType(t, focus) {
        if (!TYPES[t] || !has(TYPES[t].fam)) return;
        type = t;
        var r = one("input[name=type_ui][value=" + t + "]", res); if (r) r.checked = true;
        panelState();
        syncRes();
        if (focus) {
            go(one("#reserver", root));
            var h = one("#reserver-titre", root); if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }
        }
    }
    if (res) {
        buildDates(one("[data-dates=club]", res), nextWeekdays(K.club.jourIdx, K.club.h, K.club.min, 4), "date_club_ui");
        buildDates(one("[data-dates=atelier]", res), firstSaturdays(3), "date_atelier_ui");
        all("input[name=type_ui]", res).forEach(function (r) {
            if (!has(TYPES[r.value].fam)) { var box = r.closest(".rx-type"); if (box) box.hidden = true; }
            r.addEventListener("change", function () { setType(r.value, false); });
        });
        all("input[name='jour_ui[]'], input[name=plage_ui]", res).forEach(function (i) { i.addEventListener("change", syncRes); });
        var mod = one("#res-modalite", res); if (mod) mod.addEventListener("change", panelState);
        if (C.bookingUrl) { var link = one("[data-booking]", res); if (link) link.hidden = false; }
        // contrôle des choix par pastilles, avant le contrôle général des champs
        res.addEventListener("submit", function (e) {
            syncRes();
            var msg = "", target = null;
            if (type === "appel") {
                if (!one("input[name='jour_ui[]']:checked", res)) { msg = "Choisis au moins un jour où on peut t’appeler."; target = one("input[name='jour_ui[]']", res); }
                else if (!one("input[name=plage_ui]:checked", res)) { msg = "Choisis une plage horaire."; target = one("input[name=plage_ui]", res); }
            } else if (!one("input[name=date_" + type + "_ui]:checked", res)) {
                msg = "Choisis une date."; target = one("input[name=date_" + type + "_ui]", res);
            }
            if (msg) {
                e.preventDefault(); e.stopImmediatePropagation();
                status(res, "error", msg);
                if (target) target.focus();
            }
        }, true);
        panelState();
        var asked = params.get("reserver");
        if (asked) setType(asked, false);
        syncRes();
    }
    root.addEventListener("click", function (e) {
        var b = e.target && e.target.closest ? e.target.closest("[data-reserve]") : null;
        if (b && res) { e.preventDefault(); setType(b.getAttribute("data-reserve"), true); }
    });

    // ------------------------------------------------------------------------------------------ 4. séance guidée
    var tm = one("[data-session]", root);
    if (tm) {
        var SEG = [{ n: "Marche d’échauffement", d: 300, t: "marche" }];
        for (var r = 1; r <= 5; r += 1) { SEG.push({ n: "Course facile", d: 120, t: "course", r: r }); SEG.push({ n: "Marche", d: 60, t: "marche", r: r }); }
        SEG.push({ n: "Marche pour terminer", d: 300, t: "marche" });
        var TOTAL = SEG.reduce(function (a, s) { return a + s.d; }, 0);
        var phase = one("[data-phase]", tm), clock = one("[data-clock]", tm), bar = one("progress", tm), meta = one("[data-meta]", tm);
        var bStart = one("[data-start]", tm), bReset = one("[data-reset]", tm), snd = one("[data-sound]", tm), done = one("[data-done]", tm);
        var base = 0, t0 = 0, running = false, timer = 0, last = -1, audio = null, lock = null;
        bar.max = TOTAL;
        var segAt = function (sec) { var acc = 0; for (var i = 0; i < SEG.length; i += 1) { if (sec < acc + SEG[i].d) return { i: i, left: acc + SEG[i].d - sec }; acc += SEG[i].d; } return { i: SEG.length, left: 0 }; };
        var beep = function (hz, ms) {
            if (!snd.checked) return;
            try {
                var A = window.AudioContext || window.webkitAudioContext; if (!A) return;
                audio = audio || new A();
                if (audio.state === "suspended" && audio.resume) audio.resume();
                var o = audio.createOscillator(), g = audio.createGain();
                o.frequency.value = hz; g.gain.value = 0.09; o.connect(g); g.connect(audio.destination); o.start(); o.stop(audio.currentTime + ms / 1000);
            } catch (err) { /* le son est facultatif */ }
        };
        var buzz = function (ms) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (err) { /* facultatif */ } };
        var permis = function (nom) { try { var pp = doc.permissionsPolicy || doc.featurePolicy; return !pp || !pp.allowsFeature || pp.allowsFeature(nom); } catch (err) { return true; } };
        var keepAwake = function (on) {
            try {
                if (on && navigator.wakeLock && permis("screen-wake-lock")) navigator.wakeLock.request("screen").then(function (l) { lock = l; }, function () { lock = null; });
                else if (!on && lock) { lock.release(); lock = null; }
            } catch (err) { /* facultatif */ }
        };
        var paint = function (sec) {
            var s = segAt(Math.floor(sec));
            if (s.i >= SEG.length) return;
            var seg = SEG[s.i];
            clock.textContent = fmtTime(s.left);
            bar.value = Math.min(sec, TOTAL);
            meta.textContent = "Étape " + (s.i + 1) + " sur " + SEG.length + " · temps restant " + fmtTime(TOTAL - sec);
            if (s.i !== last) {
                last = s.i;
                phase.textContent = seg.n + (seg.r ? " · répétition " + seg.r + " sur 5" : "") + " · " + (seg.d >= 120 ? Math.round(seg.d / 60) + " minutes" : seg.d >= 60 ? "1 minute" : seg.d + " secondes");
                phase.setAttribute("data-run", seg.t);
                if (running) { beep(seg.t === "course" ? 880 : 523, 220); buzz(seg.t === "course" ? [180, 80, 180] : 160); }
            }
        };
        var tick = function () {
            var sec = base + (Date.now() - t0) / 1000;
            if (sec >= TOTAL) { finish(); return; }
            paint(sec);
        };
        var finish = function () {
            running = false; clearInterval(timer); keepAwake(false);
            clock.textContent = "0:00"; bar.value = TOTAL; last = SEG.length;
            phase.textContent = "Séance terminée"; phase.setAttribute("data-run", "fin");
            meta.textContent = "Étape " + SEG.length + " sur " + SEG.length + " · bravo";
            bStart.textContent = "Recommencer"; bStart.setAttribute("data-state", "fin");
            bReset.hidden = true; done.hidden = false;
            beep(880, 200); setTimeout(function () { beep(1175, 320); }, 260); buzz([200, 100, 200, 100, 400]);
        };
        var start = function () {
            if (bStart.getAttribute("data-state") === "fin") reset();
            base = base || 0; t0 = Date.now(); running = true; done.hidden = true;
            bStart.textContent = "Pause"; bStart.setAttribute("data-state", "run"); bReset.hidden = false;
            keepAwake(true);
            clearInterval(timer); timer = setInterval(tick, 250); tick();
        };
        var pause = function () {
            base += (Date.now() - t0) / 1000; running = false; clearInterval(timer); keepAwake(false);
            bStart.textContent = "Reprendre"; bStart.setAttribute("data-state", "pause");
        };
        var reset = function () {
            running = false; clearInterval(timer); keepAwake(false); base = 0; last = -1;
            clock.textContent = fmtTime(TOTAL); bar.value = 0; phase.textContent = "Prêt à partir"; phase.setAttribute("data-run", "pret");
            meta.textContent = "Étape 0 sur " + SEG.length + " · temps restant " + fmtTime(TOTAL);
            bStart.textContent = "Démarrer la séance"; bStart.setAttribute("data-state", "pret"); bReset.hidden = true; done.hidden = true;
        };
        bStart.addEventListener("click", function () { var st = bStart.getAttribute("data-state"); if (st === "run") pause(); else start(); });
        bReset.addEventListener("click", reset);
        reset();
    }
  })();
  // Formulaires
  function encode(form) {
    var data = new FormData(form), out = new URLSearchParams(), skip = {};
    all("[data-nomail]", form).forEach(function (f) { if (f.name) skip[f.name] = true; });
    data.forEach(function (v, k) { if (!skip[k]) out.append(k, v); });
    return out.toString();
  }
  function status(form, state, text) {
    var el = one(".form-status", form);
    if (!el) return;
    el.hidden = false; el.setAttribute("data-state", state); el.textContent = text;
  }
  function validate(form, root) {
    var bad = null;
    all("[required]", root || form).forEach(function (f) {
      var ok = f.type === "checkbox" ? f.checked : f.value.trim() !== "";
      if (ok && f.type === "email") ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.value.trim());
      f.setAttribute("aria-invalid", ok ? "false" : "true");
      if (!ok && !bad) bad = f;
    });
    return bad;
  }
  function labelOf(form, field) {
    if (field.getAttribute("data-etiquette")) return field.getAttribute("data-etiquette");
    var names = {
      programme: "Formation", duree: "Durée", articles: "Articles", total: "Total",
      option: field.value || "Option à la carte", conditions: "conditions de vente",
      consentement: "consentement", consentement_sante: "consentement pour les renseignements sportifs et de santé"
    };
    if (names[field.name]) return names[field.name];
    var l = field.id && one('label[for="' + field.id + '"]', form);
    return l ? l.childNodes[0].textContent.trim() : field.name || "champ requis";
  }
  function formText(form) {
    var data = new FormData(form), lines = ["Demande RUNAX", ""];
    all("input, select, textarea", form).forEach(function (field) {
      if (field.disabled || !field.name || field.hasAttribute("data-nomail") || /^(form-name|bot-field|conditions|consentement|consentement_sante)$/.test(field.name)) return;
      if ((field.type === "checkbox" || field.type === "radio") && !field.checked) return;
      if (field.type === "hidden" && !field.value) return;
      var label = labelOf(form, field);
      var value = field.type === "checkbox" ? field.value : field.value.trim();
      if (field.tagName === "SELECT" && field.selectedIndex >= 0) value = field.options[field.selectedIndex].text;
      if (!value.trim()) return;
      lines.push(label + " : " + value);
    });
    return lines.join("\n");
  }
  function copyText(text, done) {
    var pp = doc.permissionsPolicy || doc.featurePolicy, ouvert = !pp || !pp.allowsFeature || pp.allowsFeature("clipboard-write");
    if (ouvert && navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
      return;
    }
    var area = doc.createElement("textarea");
    area.value = text; area.setAttribute("readonly", ""); area.className = "sr";
    doc.body.appendChild(area); area.select();
    var ok = false;
    try { ok = doc.execCommand("copy"); } catch (e) {}
    area.remove(); done(ok);
  }
  function prixLigne(i) {
    return " (" + money(i.prix) + " l’unité, avant taxes)";
  }
  function mailtoSend(form, kind) {
    var subject = "RUNAX · " + (form.getAttribute("data-sujet") || (kind === "inscription" ? "Demande de coaching" : kind === "commande" ? "Commande" : "Message"));
    var url = "mailto:" + C.email + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(formText(form));
    status(form, "ok", "Ta demande est prête : ton application de courriel s’ouvre avec le message déjà rédigé. Appuie sur « Envoyer » pour la transmettre à Alexandre. Rien ne s’ouvre ? Copie ta demande et écris à " + C.email + "." + (form.getAttribute("data-apres") ? " " + form.getAttribute("data-apres") : ""));
    var statusBox = one(".form-status", form); if (statusBox) { statusBox.tabIndex = -1; statusBox.focus(); }
    var box = one(".form-status", form), btn = doc.createElement("button");
    btn.type = "button"; btn.className = "btn btn--dark status-copy"; btn.textContent = "Copier ma demande";
    btn.addEventListener("click", function () {
      copyText(formText(form), function (ok) {
        btn.textContent = ok ? "Demande copiée" : "Sélectionne et copie les champs du formulaire";
        if (ok) say("Ta demande a été copiée.");
      });
    });
    box.appendChild(doc.createTextNode(" ")); box.appendChild(btn);
    __L.href = url;
  }

  all("form[data-form]").forEach(function (form) {
    var kind = form.getAttribute("data-form");
    form.addEventListener("input", function (e) { if (e.target.getAttribute("aria-invalid") === "true") e.target.setAttribute("aria-invalid", "false"); });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var bad = validate(form);
      if (bad) {
        status(form, "error", bad.type === "email" && bad.value.trim() !== ""
          ? "L’adresse courriel semble incomplète. Exemple : nom@exemple.com."
          : "Il manque une information : vérifie le champ « " + labelOf(form, bad) + " ».");
        bad.focus();
        return;
      }
      if (kind === "commande") {
        var items = loadCart();
        if (!items.length) { status(form, "error", "Ton panier est vide : ajoute une pièce depuis la boutique."); return; }
        one("[name=articles]", form).value = items.map(function (i) {
          return i.nom + ", " + (i.taille === "Taille unique" ? "taille unique" : "taille " + i.taille) + ", quantité " + i.qte + prixLigne(i);
        }).join("\n");
      }
      if (!C.formEndpoint) {
        if (C.email) { mailtoSend(form, kind); return; }
      }
      var btn = one('button[type="submit"]', form);
      if (btn) btn.disabled = true;
      status(form, "ok", "Envoi en cours…");
      fetch(C.formEndpoint, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: encode(form) })
        .then(function (r) { if (!r.ok) throw new Error("http " + r.status); })
        .then(function () {
          if (kind === "commande") writeCart(null);
          __L.href = form.getAttribute("action");
        })
        .catch(function () {
          if (btn) btn.disabled = false;
          status(form, "error", "L’envoi n’a pas fonctionné. Écris-nous directement à " + (C.email || "notre adresse de contact") + " et nous te répondons rapidement.");
        });
    });
  });

  // Page de remerciement
  var titre = one("[data-merci-titre]");
  if (titre) {
    var s = params.get("statut");
    var texte = one("[data-merci-texte]");
    var MERCI = {
      message: ["Message envoyé.", "Alexandre te répondra par courriel."],
      demande: ["Demande reçue.", "Alexandre examinera ta demande et t’écrira pour confirmer les modalités. Aucun paiement n’a été effectué."],
      commande: ["Demande reçue.", "On t’écrira pour confirmer les détails, le prix, la disponibilité et la livraison. Aucun paiement n’a été effectué."],
      reservation: ["Réservation reçue.", "Alexandre te confirme l’heure ou la place par courriel dans les 24 h ouvrables. Aucun paiement n’a été effectué."],
      attente: ["Tu es sur la liste.", "On t’écrira dès qu’il y aura du nouveau."]
    };
    if (MERCI[s]) { titre.textContent = MERCI[s][0]; if (texte) texte.textContent = MERCI[s][1]; }
  }
})();
