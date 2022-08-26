import { Row, Col, Container, Button, Nav, Navbar } from "react-bootstrap";
import { io } from "socket.io-client";
import { useState } from "react";
//import KeyInput from './components/KeyInput';
import RuntimeSelector from "./components/RuntimeSelector";
import InvoiceModal from "./components/InvoiceModal";
import "./wireguard.js";
import { getTimeStamp } from "./timefunction.js";
import HeaderInfo from "./components/HeaderInfo";
import logo from "./media/tunnelsats_headerlogo3.png";
import WorldMap from "./components/WorldMap";
import { Form, InputGroup } from "react-bootstrap";
import { IoIosRefresh } from "react-icons/io";

import UpdateSubscription from "./components/UpdateSubscription";
import MainComponent from "./components/MainPage";

// Necessary for Routing Endpoints
import { BrowserRouter, Link, Route, Routes } from "react-router-dom";

// helper
const getDate = (timestamp) =>
  (timestamp !== undefined ? new Date(timestamp) : new Date()).toISOString();
// Env Variables to have the same code base main and dev
const REACT_APP_THREE_MONTHS = process.env.REACT_APP_THREE_MONTHS || 0.002;
const REACT_APP_LNBITS_URL = process.env.REACT_APP_LNBITS_URL || "";
const REACT_APP_SOCKETIO = process.env.REACT_APP_SOCKETIO || "/";

const DEBUG = false;

// WebSocket
var socket = io.connect(REACT_APP_SOCKETIO);

// Consts
var emailAddress;
var clientPaymentHash;
var isPaid = false;

function App() {
  const [keyPair, displayNewPair] = useState(
    window.wireguard.generateKeypair()
  );
  const [priceDollar, updatePrice] = useState(REACT_APP_THREE_MONTHS);
  const [satsPerDollar, setSatsPerDollar] = useState(
    Math.round(100000000 / 22000)
  );
  const [showSpinner, setSpinner] = useState(true);
  const [payment_request, setPaymentrequest] = useState(0);
  const [showPaymentSuccessfull, setPaymentAlert] = useState(false);
  //Modal Invoice
  const [visibleInvoiceModal, setShowInvoiceModal] = useState(false);
  const closeInvoiceModal = () => setShowInvoiceModal(false);
  const showInvoiceModal = () => setShowInvoiceModal(true);
  //Modal Configdata
  const [isConfigModal, showConfigModal] = useState(false);
  const renderConfigModal = () => showConfigModal(true);
  const hideConfigModal = () => showConfigModal(false);
  //LoginModal
  //const [isLoginModal, showLoginModal] = useState(false);
  //const renderLoginModal = () => showLoginModal(true);
  //const hideLoginModal = () => showLoginModal(false);

  // World Map
  const [country, updateCountry] = useState("eu");

  /* WorldMap Continent Codes
    AF = Africa
    NA = North America (US+CAD)
    SA = South America (LatAm)
    EU = Europe
    AS = Asia
    OC = Oceania (AUS+NZ)
  */

  // fetch btc price per dollar
  /*
  useEffect(() => {
    // fetch btc price
    const request = setInterval(() => {
      getPrice();
    }, 600000); // 10min
    // clearing interval
    return () => clearInterval(request);
  }, []);
  */

  // // randomize wireguard keys
  // useEffect(() => {
  //   const timer = setInterval(() => {
  //     displayNewPair(window.wireguard.generateKeypair);
  //     DEBUG && console.log(`${getDate()} newKeyPair`);
  //   }, 30000); // 30s
  //   // clearing interval
  //   return () => clearInterval(timer);
  // }, []);

  //Successful payment alert
  const renderAlert = (show) => {
    setPaymentAlert(show);
    setTimeout(() => setPaymentAlert(false), [2000]);
  };

  //Updates the QR-Code
  const updatePaymentrequest = () => {
    socket.on("lnbitsInvoice", (invoiceData) => {
      DEBUG && console.log(`${getDate()} App.js: got msg lnbitsInvoice`);
      DEBUG &&
        console.log(
          `${getDate()} Paymenthash: ${invoiceData.payment_hash}, ${
            invoiceData.payment_request
          }`
        );
      setPaymentrequest(invoiceData.payment_request);
      clientPaymentHash = invoiceData.payment_hash;
      setSpinner(false);
    });
  };

  //Connect to WebSocket Server
  socket.removeAllListeners("connect").on("connect", () => {
    DEBUG && console.log(`${getDate()} App.js: connect with id: ${socket.id}`);
    //Checks for already paid invoice if browser switche tab on mobile
    if (clientPaymentHash !== undefined) {
      checkInvoice();
    }
    // refresh pricePerDollar on start
    getPrice();
  });

  // get current btc per dollar
  const getPrice = () => {
    socket.removeAllListeners("getPrice").emit("getPrice");
  };
  socket.off("receivePrice").on("receivePrice", (price) => {
    DEBUG && console.log(`${getDate()} App.js: server.getPrice(): ${price}`);
    setSatsPerDollar(Math.trunc(Math.round(price)));
  });

  // check invoice
  const checkInvoice = () => {
    DEBUG &&
      console.log(`${getDate()} App.js: checkInvoice(): ${clientPaymentHash}`);
    socket.emit("checkInvoice", clientPaymentHash);
  };

  //Get the invoice
  const getInvoice = (price, publicKey, presharedKey, priceDollar, country) => {
    DEBUG && console.log(`${getDate()} App.js: getInvoice(price): ${price}$`);
    socket.emit(
      "getInvoice",
      price,
      publicKey,
      presharedKey,
      priceDollar,
      country
    );
  };

  socket.off("invoicePaid").on("invoicePaid", (paymentHash) => {
    DEBUG &&
      console.log(
        `${getDate()} App.js: got msg 'invoicePaid': ${paymentHash}, clientPaymentHash: ${clientPaymentHash}`
      );

    if (paymentHash === clientPaymentHash && !isPaid) {
      renderAlert(true);
      isPaid = true;
      setSpinner(true);
    }
  });

  //Get wireguard config from Server
  socket.off("receiveConfigData").on("receiveConfigData", (wireguardConfig) => {
    DEBUG && console.log(`${getDate()} App.js: got msg receiveConfigData`);
    setSpinner(false);
    setPaymentrequest(buildConfigFile(wireguardConfig).join("\n"));
  });

  //Construct the Config File
  const buildConfigFile = (serverResponse) => {
    showInvoiceModal();
    renderConfigModal();
    const configArray = [
      "[Interface]",
      "PrivateKey = " + keyPair.privateKey,
      "Address = " + serverResponse.ipv4Address,
      // 'DNS = '+serverResponse.dns,
      "#VPNPort = " + serverResponse.portFwd,
      "#ValidUntil (UTC time)= " + getTimeStamp(priceDollar).toISOString(),
      " ",
      "[Peer]",
      "PublicKey = " + serverResponse.publicKey,
      "PresharedKey = " + keyPair.presharedKey,
      "Endpoint = " + serverResponse.dnsName + ":" + serverResponse.listenPort,
      "AllowedIPs = " + serverResponse.allowedIPs,
    ];
    return configArray;
  };

  //Change Runtime
  const runtimeSelect = (e) => {
    if (!isNaN(e.target.value)) {
      updatePrice(e.target.value);
    }
  };

  //  const countrySelect = (e) => {
  //    updateCountry(e.target.value);
  //  };

  const download = (filename, text) => {
    const textArray = [text];
    const element = document.createElement("a");
    const file = new Blob(textArray, {
      endings: "native",
    });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
  };

  const sendEmail = (email, config, date) => {
    DEBUG &&
      console.log(
        `${getDate()} App.js: sendEmail(): ${email}, validdate: ${date}`
      );
    socket.emit("sendEmail", email, config, date);
  };

  return (
    <div>
      <BrowserRouter>
        <Container>
          <Navbar variant="dark" expanded="true">
            <Container>
              <Navbar.Brand as={Link} to="/">
                Tunnel⚡️Sats
              </Navbar.Brand>
              <Nav className="me-auto">
                <Nav.Link as={Link} to="/updatesub">
                  Update Subscription
                </Nav.Link>
                <Nav.Link
                  href="https://blckbx.github.io/tunnelsats"
                  target="_blank"
                  rel="noreferrer"
                >
                  Guide
                </Nav.Link>
                <Nav.Link
                  href="https://blckbx.github.io/tunnelsats/FAQ.html"
                  target="_blank"
                  rel="noreferrer"
                >
                  FAQ
                </Nav.Link>
              </Nav>
              {/*}
            <Nav>
              <Button onClick={() => renderLoginModal()} variant="outline-info">Login</Button>
              <LoginModal show={isLoginModal} handleClose={hideLoginModal} />
            </Nav>
            */}
            </Container>
          </Navbar>
        </Container>
        <Routes>
          <Route
            path="/updatesub"
            element={<UpdateSubscription socket={socket} />}
          />
          <Route path="/" element={<MainComponent socket={socket} />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
