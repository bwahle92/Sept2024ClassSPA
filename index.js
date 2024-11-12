import { header, nav, main, footer } from "./components";
import * as store from "./store";
import Navigo from "navigo";
import { camelCase } from "lodash";
import { viewNotFound } from "./views";
import links from "./store/links";
import axios from "axios";

const router = new Navigo("/");

function render(state = store.home) {
  document.querySelector("#root").innerHTML = `
      ${header(state)}
      ${nav(store.links)}
      ${main(state)}
      ${footer()}
    `;
  router.updatePageLinks();
}
router.hooks({
  // We pass in the `done` function to the before hook handler to allow the function to tell Navigo we are finished with the before hook.
  // The `match` parameter is the data that is passed from Navigo to the before hook handler with details about the route being accessed.
  // https://github.com/krasimir/navigo/blob/master/DOCUMENTATION.md#match
  before: (done, match) => {
    // We need to know what view we are on to know what data to fetch
    const view = match?.data?.view ? camelCase(match.data.view) : "home";
    // Add a switch case statement to handle multiple routes
    switch (view) {
      // Add a case for each view that needs data from an API
      case "home":
        axios
          .get(
            `https://api.openweathermap.org/data/2.5/weather?appid=${process.env.OPEN_WEATHER_MAP_API_KEY}&q=st%20louis&units=imperial`
          )
          .then((response) => {
            console.log("Weather Response Data", response.data);
            store.home.weather = {
              city: response.data.name,
              temp: response.data.main.temp,
              feelsLike: response.data.main.feels_like,
              description: response.data.weather[0].main,
            };
            done();
          })
          .catch((error) => {
            console.log("It puked", error);
            done();
          });
        break;
        case "pizza":
          // New Axios get request utilizing already made environment variable
          axios
            .get(`${process.env.PIZZA_PLACE_API_URL}/pizzas`)
            .then(response => {
              // We need to store the response to the state, in the next step but in the meantime let's see what it looks like so that we know what to store from the response.
              console.log("response", response);
              store.pizza.pizzas = response.data;
  
              done();
            })
            .catch(error => {
              console.log("It puked", error);
              done();
            });
          break;
          default:
        // We must call done for all views so we include default for the views that don't have cases above.
        done();
      // break is not needed since it is the last condition, if you move default higher in the stack then you should add the break statement.
    }
  },
  already: (match) => {
    const view = match?.data?.view ? camelCase(match.data.view) : "home";

    render(store[view]);
  },
  after: (match) => {
    const view = match?.data?.view ? camelCase(match.data.view) : "home";

    if (view === "order") {
      // Add an event handler for the submit button on the form
      document.querySelector("form").addEventListener("submit", (event) => {
        event.preventDefault();

        // Get the form element
        const inputList = event.target.elements;
        console.log("Input Element List", inputList);

        // Create an empty array to hold the toppings
        const toppings = [];

        // Iterate over the toppings array

        for (let input of inputList.toppings) {
          // If the value of the checked attribute is true then add the value to the toppings array
          if (input.checked) {
            toppings.push(input.value);
          }
        }

        // Create a request body object to send to the API
        const requestData = {
          customer: inputList.customer.value,
          crust: inputList.crust.value,
          cheese: inputList.cheese.value,
          sauce: inputList.sauce.value,
          toppings: toppings,
        };
        // Log the request body to the console
        console.log("request Body", requestData);

        axios
          // Make a POST request to the API to create a new pizza
          .post(`${process.env.PIZZA_PLACE_API_URL}/pizzas`, requestData)
          .then((response) => {
            //  Then push the new pizza onto the Pizza state pizzas attribute, so it can be displayed in the pizza list
            store.pizza.pizzas.push(response.data);
            router.navigate("/pizza");
          })
          // If there is an error log it to the console
          .catch((error) => {
            console.log("It puked", error);
          });
      });
    }
    router.updatePageLinks();

    // add menu toggle to bars icon in nav bar
    document.querySelector(".fa-bars").addEventListener("click", () => {
      document.querySelector("nav > ul").classList.toggle("hidden--mobile");
    });
  },
});
// router.on("/", () => render(store.home)).resolve();

router
  .on({
    "/": () => render(store.home),

    ":view": (match) => {
      const view = match?.data?.view ? camelCase(match.data.view) : "home";

      if (view in store) {
        render(store[view]);
      } else {
        render(store.viewNotFound);
        console.log(`View Not Found ${view}`);
      }
    },
  })
  .resolve();
