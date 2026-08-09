
(() => {
  if (window.__cyberguardUI) return;
  window.__cyberguardUI = true;

  marked.setOptions({gfm:true, breaks:true});

  const clean = text => DOMPurify.sanitize(marked.parse(text || ""));

  function upgrade(root=document) {
    root.querySelectorAll("pre").forEach(pre => {
      if (pre.dataset.cgDone) return;
      const code = pre.querySelector("code");
      if (!code) return;
      pre.dataset.cgDone = "1";

      const langClass = [...code.classList].find(c => c.startsWith("language-"));
      const lang = langClass ? langClass.slice(9) : "code";

      try { hljs.highlightElement(code); } catch (_) {}

      const box = document.createElement("div");
      box.className = "cg-code";
      const bar = document.createElement("div");
      bar.className = "cg-code-bar";

      const label = document.createElement("span");
      label.textContent = lang.toUpperCase();

      const copy = document.createElement("button");
      copy.type = "button";
      copy.textContent = "نسخ";
      copy.onclick = async () => {
        try {
          await navigator.clipboard.writeText(code.innerText);
          copy.textContent = "تم النسخ ✓";
          setTimeout(() => copy.textContent = "نسخ", 1200);
        } catch (_) { copy.textContent = "تعذر النسخ"; }
      };

      bar.append(label, copy);
      pre.parentNode.insertBefore(box, pre);
      box.append(bar, pre);
    });
  }

  // Expose a helper for the existing chat code.
  window.CyberGuardMarkdown = text => {
    const holder = document.createElement("div");
    holder.innerHTML = clean(text);
    upgrade(holder);
    return holder.innerHTML;
  };

  // Automatically enhance dynamically-added AI messages.
  const observer = new MutationObserver(mutations => {
    for (const m of mutations)
      for (const n of m.addedNodes)
        if (n.nodeType === 1) upgrade(n);
  });
  observer.observe(document.body, {childList:true, subtree:true});

  // If an existing frontend uses common message selectors, render raw AI markdown.
  document.querySelectorAll(".message.ai,.message.bot,.assistant-message,.bot-message").forEach(el => {
    if (!el.dataset.cgMarkdown) {
      el.dataset.cgMarkdown = "1";
      el.innerHTML = window.CyberGuardMarkdown(el.textContent);
    }
  });
})();
