import html from "html-literal";
import navItem from "./navItem.js";

export default navItems => html`
  <nav>
    <i class="fas fa-bars"></i>
    <ul>
      ${navItems.map(item => navItem(item)).join("")}
    </ul>
  </nav>
`;
