// Modular Gunworks LLC - Gunsmithing Services Page JS

document.addEventListener('DOMContentLoaded', () => {
  renderHeader();
  renderFooter();
  renderGunsmithingPage();
});

function renderGunsmithingPage() {
  const main = document.getElementById('main-content');
  main.innerHTML = `
    <section class="section card">
      <h1 class="section-title">Gunsmithing Services</h1>
      <p>Our expert gunsmiths offer a full range of services, from basic cleaning to custom builds and precision upgrades. We emphasize reliability, safety, and compliance in every job.</p>
      <ul>
        <li>Custom builds and modifications</li>
        <li>Barrel fitting and threading</li>
        <li>Trigger jobs and action work</li>
        <li>Optics mounting and zeroing</li>
        <li>Cleaning, inspection, and repair</li>
        <li>FFL transfers and compliance consulting</li>
      </ul>
      <a href="contact.html" class="button">Request Service</a>
    </section>
  `;
}
