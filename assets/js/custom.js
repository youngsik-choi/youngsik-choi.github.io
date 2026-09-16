(function () {
  var root = document.documentElement;
  var storageKey = "ysc-color-theme";

  function getStoredTheme() {
    try {
      return localStorage.getItem(storageKey);
    } catch (error) {
      return null;
    }
  }

  function setStoredTheme(theme) {
    try {
      localStorage.setItem(storageKey, theme);
    } catch (error) {
      return;
    }
  }

  function systemTheme() {
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
    return "light";
  }

  function applyTheme(theme) {
    var activeTheme = theme === "dark" ? "dark" : "light";
    root.setAttribute("data-theme", activeTheme);

    var metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute("content", activeTheme === "dark" ? "#14241a" : "#e7f0df");
    }

    document.querySelectorAll("[data-theme-toggle]").forEach(function (button) {
      var isDark = activeTheme === "dark";
      var icon = button.querySelector("i");
      button.setAttribute("aria-pressed", String(isDark));
      button.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
      if (icon) {
        icon.className = isDark ? "fas fa-sun" : "fas fa-moon";
      }
    });
  }

  function initThemeToggle() {
    applyTheme(getStoredTheme() || systemTheme());

    document.querySelectorAll("[data-theme-toggle]").forEach(function (button) {
      button.addEventListener("click", function () {
        var nextTheme = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
        applyTheme(nextTheme);
        setStoredTheme(nextTheme);
      });
    });
  }

  function initSearch() {
    var controls = document.querySelector(".site-controls");
    if (!controls) return;

    var toggle = controls.querySelector(".site-search-toggle");
    var panel = controls.querySelector(".site-search-panel");
    var input = controls.querySelector(".site-search-input");
    var results = controls.querySelector(".site-search-results");
    var indexUrl = controls.getAttribute("data-search-index");
    var indexPromise = null;

    if (!toggle || !panel || !input || !results || !indexUrl) return;

    function loadIndex() {
      if (!indexPromise) {
        indexPromise = fetch(indexUrl).then(function (response) {
          if (!response.ok) throw new Error("Search index failed to load");
          return response.json();
        });
      }
      return indexPromise;
    }

    function normalize(value) {
      return (value || "").toString().toLowerCase();
    }

    function scoreItem(item, terms) {
      var title = normalize(item.title);
      var content = normalize([item.collection, item.excerpt, item.content].join(" "));
      var score = 0;

      terms.forEach(function (term) {
        if (title === term) score += 20;
        if (title.indexOf(term) === 0) score += 12;
        if (title.indexOf(term) > -1) score += 8;
        if (content.indexOf(term) > -1) score += 2;
      });

      return score;
    }

    function clearResults(message) {
      results.innerHTML = "";
      if (message) {
        var empty = document.createElement("p");
        empty.className = "site-search-empty";
        empty.textContent = message;
        results.appendChild(empty);
      }
    }

    function renderResults(items) {
      results.innerHTML = "";

      if (!items.length) {
        clearResults("No results found.");
        return;
      }

      items.slice(0, 8).forEach(function (item) {
        var result = document.createElement("a");
        var title = document.createElement("span");
        var meta = document.createElement("span");
        var excerpt = document.createElement("span");

        result.className = "site-search-result";
        result.href = item.url;
        result.setAttribute("role", "listitem");

        title.className = "site-search-result-title";
        title.textContent = item.title || "Untitled";

        meta.className = "site-search-result-meta";
        meta.textContent = item.collection || "page";

        excerpt.className = "site-search-result-excerpt";
        excerpt.textContent = item.excerpt || "";

        result.appendChild(title);
        result.appendChild(meta);
        result.appendChild(excerpt);
        results.appendChild(result);
      });
    }

    function runSearch() {
      var query = input.value.trim();
      var terms = normalize(query).split(/\s+/).filter(Boolean);

      if (!terms.length) {
        clearResults("Type to search pages, research, publications, talks, and teaching.");
        return;
      }

      loadIndex()
        .then(function (items) {
          var matches = items
            .map(function (item) {
              return { item: item, score: scoreItem(item, terms) };
            })
            .filter(function (entry) {
              return entry.score > 0;
            })
            .sort(function (a, b) {
              return b.score - a.score;
            })
            .map(function (entry) {
              return entry.item;
            });

          renderResults(matches);
        })
        .catch(function () {
          clearResults("Search is temporarily unavailable.");
        });
    }

    function openSearch() {
      panel.hidden = false;
      controls.classList.add("is-search-open");
      toggle.setAttribute("aria-expanded", "true");
      input.focus();
      runSearch();
    }

    function closeSearch() {
      panel.hidden = true;
      controls.classList.remove("is-search-open");
      toggle.setAttribute("aria-expanded", "false");
    }

    toggle.addEventListener("click", function () {
      if (panel.hidden) {
        openSearch();
      } else {
        closeSearch();
      }
    });

    input.addEventListener("input", runSearch);

    input.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        closeSearch();
        toggle.focus();
      }
    });

    document.addEventListener("click", function (event) {
      if (!controls.contains(event.target)) {
        closeSearch();
      }
    });
  }

  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  ready(function () {
    initThemeToggle();
    initSearch();
  });
})();
