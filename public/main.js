/* Yee Hong Ho — portfolio behaviour
   1. Live GitHub repositories
   2. Quiet hero "data-field" animation (respects reduced-motion)
*/

(function () {
  "use strict";

  /* -------------------------------------------------------
     1. Repositories — fetched client-side from the GitHub API
  ------------------------------------------------------- */
  const GH_USER = "hoyeehong";
  const ENDPOINT =
    "https://api.github.com/users/" + GH_USER + "/repos?sort=updated&per_page=12";

  const grid = document.getElementById("repos-grid");
  const status = document.getElementById("repos-status");

  function escapeHTML(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[c];
    });
  }

  function setStatus(message) {
    grid.innerHTML =
      '<p class="repos__status">' + message + "</p>";
    grid.setAttribute("aria-busy", "false");
  }

  function renderRepos(repos) {
    grid.innerHTML = "";
    grid.setAttribute("aria-busy", "false");

    repos.forEach(function (repo) {
      const li = document.createElement("li");
      li.className = "card repo";

      const desc = repo.description
        ? escapeHTML(repo.description)
        : "No description provided.";

      const lang = repo.language
        ? '<span><span class="repo__lang-dot" aria-hidden="true"></span>' +
          escapeHTML(repo.language) +
          "</span>"
        : "";

      const stars =
        '<span aria-label="' +
        repo.stargazers_count +
        ' stars">★ ' +
        repo.stargazers_count +
        "</span>";

      li.innerHTML =
        '<h3 class="repo__name"><a href="' +
        escapeHTML(repo.html_url) +
        '" target="_blank" rel="noopener">' +
        escapeHTML(repo.name) +
        "</a></h3>" +
        '<p class="repo__desc">' +
        desc +
        "</p>" +
        '<div class="repo__meta">' +
        lang +
        stars +
        "</div>";

      grid.appendChild(li);
    });
  }

  function loadRepos() {
    if (!grid) return;

    fetch(ENDPOINT, { headers: { Accept: "application/vnd.github+json" } })
      .then(function (res) {
        if (!res.ok) throw new Error("GitHub API responded " + res.status);
        return res.json();
      })
      .then(function (repos) {
        if (!Array.isArray(repos) || repos.length === 0) {
          setStatus("No public repositories to show just yet.");
          return;
        }
        renderRepos(repos);
      })
      .catch(function () {
        setStatus(
          "Couldn't load repositories right now — see them directly on " +
            '<a href="https://github.com/' +
            GH_USER +
            '" target="_blank" rel="noopener">github.com/' +
            GH_USER +
            "</a>."
        );
      });
  }

  loadRepos();

  /* -------------------------------------------------------
     2. Hero data-field — a quiet drift of connected points.
        One orchestrated, low-intensity moment; disabled for
        users who prefer reduced motion.
  ------------------------------------------------------- */
  const canvas = document.querySelector(".hero__canvas");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (canvas && !reduce) {
    const ctx = canvas.getContext("2d");
    let width = 0;
    let height = 0;
    let points = [];
    let raf = null;

    const ACCENT = "255, 180, 84"; // --accent as rgb
    const LINK_DIST = 130;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.min(70, Math.round((width * height) / 16000));
      points = [];
      for (let i = 0; i < count; i++) {
        points.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.25
        });
      }
    }

    function tick() {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;
      }

      // links
      for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
          const dx = points[i].x - points[j].x;
          const dy = points[i].y - points[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < LINK_DIST) {
            const alpha = (1 - dist / LINK_DIST) * 0.12;
            ctx.strokeStyle = "rgba(" + ACCENT + "," + alpha + ")";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(points[i].x, points[i].y);
            ctx.lineTo(points[j].x, points[j].y);
            ctx.stroke();
          }
        }
      }

      // nodes
      for (let i = 0; i < points.length; i++) {
        ctx.fillStyle = "rgba(" + ACCENT + ",0.5)";
        ctx.beginPath();
        ctx.arc(points[i].x, points[i].y, 1.4, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = window.requestAnimationFrame(tick);
    }

    let resizeTimer = null;
    window.addEventListener("resize", function () {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(resize, 150);
    });

    resize();
    tick();

    // Pause when the hero is offscreen to save battery.
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            if (!raf) tick();
          } else if (raf) {
            window.cancelAnimationFrame(raf);
            raf = null;
          }
        });
      });
      io.observe(canvas);
    }
  }
})();
