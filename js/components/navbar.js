//navigation bar component
class NavBar extends HTMLElement {
    constructor() {
      super();
    }
  
    connectedCallback() {
      this.innerHTML = `
        <nav class="navbar fixed-top navbar-expand-lg">
            <div class="container-fluid">
                <a class="navbar-brand" href="./index.html"><b>Homesteading | Dispossession</b></a>
                <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarText" aria-controls="navbarText" aria-expanded="false" aria-label="Toggle navigation">
                    &#9552;
                </button>
                <div class="collapse navbar-collapse" id="navbarText">
                    <ul class="navbar-nav me-auto mb-2 mb-lg-0 end-0">
                        <li class="nav-item">
                            <a class="nav-link" href="index.html">Homestead Act</a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="nativeHomesteads.html">Native Homesteads</a>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
        `;
    }
}
  
customElements.define('top-navbar', NavBar);
