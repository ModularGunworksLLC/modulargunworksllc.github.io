// Modular Gunworks LLC - Static Info Pages JS

document.addEventListener('DOMContentLoaded', () => {
  renderHeader();
  renderFooter();
  renderStaticPage();
});

function renderStaticPage() {
  const main = document.getElementById('main-content');
  const page = window.location.pathname.split('/').pop().replace('.html', '');
  let content = '';
  switch(page) {
    case 'about':
      content = `
        <section class="section card">
          <h1 class="section-title">About Modular Gunworks LLC</h1>
          <p>Veteran-owned hybrid tactical retail and gunsmith shop. We combine the best of modern firearm retail with custom shop expertise. Our mission: reliability, precision, and modularity for every customer.</p>
        </section>
      `;
      break;
    case 'contact':
      content = `
        <section class="section card">
          <h1 class="section-title">Contact Us</h1>
          <p>Email: <a href="mailto:info@modulargunworks.com">info@modulargunworks.com</a></p>
          <p>Phone: (555) 123-4567</p>
          <form>
            <label>Name<br><input type="text" name="name" required></label><br>
            <label>Email<br><input type="email" name="email" required></label><br>
            <label>Message<br><textarea name="message" required></textarea></label><br>
            <input type="submit" class="button" value="Send">
          </form>
        </section>
      `;
      break;
    case 'ffl':
      content = `
        <section class="section card">
          <h1 class="section-title">FFL Information & Compliance</h1>
          <p>We are a licensed FFL dealer. All firearm sales comply with federal, state, and local laws. FFL transfers available. Please contact us for details or to arrange a transfer.</p>
        </section>
      `;
      break;
    case 'terms':
      content = `
        <section class="section card">
          <h1 class="section-title">Terms, Privacy, Shipping & Returns</h1>
          <p>See our full policies for details on privacy, shipping, and returns. We comply with all applicable laws and regulations.</p>
        </section>
      `;
      break;
    default:
      content = '<div class="card">Page not found.</div>';
  }
  main.innerHTML = content;
}

// Global header renderer for all pages
function renderHeader() {
  // No-op: header is static in HTML, but function exists to prevent errors
}

// Global footer renderer for all pages
function renderFooter() {
  // Optionally, you can inject a footer here if needed
}
