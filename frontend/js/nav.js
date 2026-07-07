// Marks the current sidebar link as active based on <body data-page="...">
document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page;
  if (!page) return;
  document.querySelectorAll('.nav-item[data-page]').forEach(a => {
    if (a.dataset.page === page) a.classList.add('active');
  });
});
