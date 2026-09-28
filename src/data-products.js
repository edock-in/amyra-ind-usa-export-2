/* ---------- Places, routes, products ---------- */
window.G = window.G || {};
(function (G) {
  // [longitude, latitude]
  G.PLACES = {
    delhi: [77.21, 28.61],       // DGFT, New Delhi
    uspto: [-77.06, 38.80],      // Alexandria, Virginia
    irs: [-77.03, 38.89],        // Washington, DC
    nynj: [-74.14, 40.68],       // Port of New York and New Jersey
    jfk: [-73.78, 40.64],
    fba: [-74.62, 40.21],        // an Amazon warehouse in New Jersey (Amazon picks the real one)
    customer: [-83.00, 39.96]    // Columbus, Ohio
  };
  G.CUSTOMER = { name: "Columbus, Ohio", short: "Columbus", tz: "America/New_York" };

  // Links to edock.io carry utm tags with this id, so Edock can see which game sent each visitor.
  G.GAME_ID = "amyra-ind-usa-export-2";
  // The live Edock session promoted at the end. After endsAt, the invite points to all upcoming sessions.
  G.SESSION = {
    title: "India to USA: Your first export on Amazon",
    host: "With Nishant Chaudhary, Business Head, Amyra Farms",
    when: "Fri, 2 Oct · 7:00 to 8:30 PM IST · Zoom",
    month: "OCT", day: "2",
    url: "https://edock.io/guest/community?event=india-to-usa-your-first-export-on-amazon&tab=events",
    campaign: "india-to-usa-first-export-2oct",
    endsAt: "2026-10-02T20:30:00+05:30",
    allUrl: "https://edock.io/guest/community?tab=events",
    allCampaign: "edock-sessions"
  };

  // Illustrative sea lane: Arabian Sea, Gulf of Aden, Red Sea, Suez, Mediterranean, Atlantic
  var RED_MED = [[54.0, 14.0], [45.5, 12.2], [43.35, 12.6], [41.8, 15.0], [38.8, 20.0], [36.2, 24.0], [34.3, 27.2], [33.0, 28.8], [32.56, 29.95], [32.31, 31.26], [32.3, 31.6], [30.0, 32.6], [27.5, 33.4], [25.0, 33.9], [18.0, 35.5], [11.6, 37.3], [6.5, 37.8], [-1.5, 36.2], [-5.6, 35.95], [-9.8, 36.4], [-35.0, 38.5], [-60.0, 40.2], [-73.85, 40.45], [-74.08, 40.62], [-74.14, 40.68]];
  G.LANES = {
    nhava: [[72.95, 18.95], [70.0, 18.0], [62.0, 16.0]].concat(RED_MED),
    kochi: [[76.26, 9.97], [75.2, 9.4], [73.0, 9.1], [68.0, 11.0], [62.0, 13.2]].concat(RED_MED),
    chennai: [[80.30, 13.10], [81.2, 11.0], [82.3, 8.5], [81.9, 6.3], [80.6, 5.6], [78.5, 5.9], [76.0, 7.6], [73.0, 8.0], [68.0, 10.5], [62.0, 13.2]].concat(RED_MED)
  };

  G.CLUSTERS = [
    { id: "moradabad", name: "Moradabad", what: "brass", ll: [78.78, 28.84] },
    { id: "panipat", name: "Panipat", what: "home textiles", ll: [76.97, 29.39] },
    { id: "kanpur", name: "Kanpur", what: "leather", ll: [80.33, 26.45] },
    { id: "guntur", name: "Guntur", what: "spices", ll: [80.44, 16.31] },
    { id: "channapatna", name: "Channapatna", what: "wooden toys", ll: [77.21, 12.65] },
    { id: "tiruppur", name: "Tiruppur", what: "textiles", ll: [77.34, 11.11] },
    { id: "kerala", name: "Kerala", what: "spices", ll: [76.27, 9.93] }
  ];

  var ICON = {
    cushion: '<path d="M4.5 6.5c3 1.2 12 1.2 15 0 1.2 3 1.2 8 0 11-3-1.2-12-1.2-15 0-1.2-3-1.2-8 0-11z"/><path d="M8.5 12h7" opacity=".55"/>',
    pepper: '<circle cx="8" cy="15" r="3.3"/><circle cx="15.6" cy="14.2" r="3.3"/><circle cx="11.6" cy="7.8" r="3.3"/>',
    toy: '<path d="M12 2.6v2.8"/><ellipse cx="12" cy="8.3" rx="3" ry="1.7"/><ellipse cx="12" cy="12.7" rx="4.6" ry="2.1"/><ellipse cx="12" cy="17.9" rx="6.4" ry="2.5"/>'
  };

  G.PRODUCTS = {
    cushion: {
      id: "cushion", icon: ICON.cushion, name: "Cotton cushion cover", short: "Cushion cover", plural: "cushion covers",
      a: "A cotton cushion cover", kind: "For the home", cluster: "panipat",
      maker: { name: "Panipat", region: "Haryana", ll: [76.97, 29.39], note: "Panipat is one of India's big home-textile towns." },
      farm: null,
      inland: [[75.80, 26.91], [72.58, 23.02]],
      port: { name: "Nhava Sheva", sub: "Mumbai", ll: [72.95, 18.95] }, lane: "nhava",
      airport: { name: "Delhi airport", code: "DEL", ll: [77.10, 28.56] },
      tm: ["24", "Textiles and household linen"],
      hs: ["6304.92", "cotton furnishing articles"],
      fit: [["Small and light", 1], ["Hard to break", 1], ["Not too cheap", 1], ["Few rules abroad", 1]],
      pick: "Light, flat, hard to break, and few rules. A textbook first product.",
      brand: "Weave or print the brand into a sewn-in label.",
      rules: {
        level: "Light", pin: null, gated: false,
        line: "The US asks for little: a label with the fibre, how to wash it, and “Made in India”.",
        items: ["A label naming the fibre, like “100% cotton”", "Washing instructions", "“Made in India” on the product or its packaging"]
      },
      keywords: "Americans search for a “throw pillow cover”, not a “cushion cover”.",
      claims: null, extraIndia: null, shipNote: null,
      price: { price: 24.99, unit: "set of two covers", cost: 350, ship: 0.9, duty: 20, ref: 15, fba: 4.3, ads: 2.5, conv: 2, fx: 88 }
    },
    pepper: {
      id: "pepper", icon: ICON.pepper, name: "Whole black pepper", short: "Black pepper", plural: "pouches",
      a: "A pouch of whole black pepper", kind: "Something you eat", cluster: "kerala",
      maker: { name: "Kochi", region: "Kerala", ll: [76.27, 9.93], note: "Pepper grows in Kerala's hills, and the packers work in Kochi." },
      farm: { name: "Idukki hills", ll: [77.0, 9.85] },
      inland: [],
      port: { name: "Kochi port", sub: "Kerala", ll: [76.26, 9.97] }, lane: "kochi",
      airport: { name: "Kochi airport", code: "COK", ll: [76.40, 10.15] },
      tm: ["30", "Coffee, tea, spices and staple foods"],
      hs: ["0904.11", "pepper, neither crushed nor ground"],
      fit: [["Small and light", 1], ["Hard to break", 1], ["Not too cheap", 0], ["Few rules abroad", 0]],
      pick: "Light and tough, but it is food. The rules get strict, and cheap items leave little profit.",
      brand: "Print the brand on the pouch or the tin.",
      rules: {
        level: "Strict", gated: true,
        pin: { name: "FDA", sub: "Silver Spring, Maryland · food", ll: [-76.98, 39.04] },
        line: "Food answers to the FDA: a registered facility, a US agent, and a notice before every shipment.",
        items: ["The packing facility registers with the FDA, renewed every two years", "A US Agent: a US-based contact the FDA can call", "Prior Notice filed before every shipment arrives", "A label in the US food format"]
      },
      keywords: "US shoppers type “whole black peppercorns”, and gourmet buyers look for the Tellicherry grade.",
      claims: "“Organic” on the label needs certification.",
      extraIndia: "Spice exporters also register with the Spices Board of India, which issues a certificate called CRES.",
      shipNote: "Your forwarder or broker files the FDA Prior Notice before the goods arrive.",
      price: { price: 12.99, unit: "8 oz pouch", cost: 230, ship: 0.45, duty: 20, ref: 8, fba: 3.4, ads: 1.5, conv: 2, fx: 88 }
    },
    toy: {
      id: "toy", icon: ICON.toy, name: "Wooden stacking toy", short: "Wooden toy", plural: "toys",
      a: "A lacquered wooden stacking toy", kind: "Something for a child", cluster: "channapatna",
      maker: { name: "Channapatna", region: "Karnataka", ll: [77.21, 12.65], note: "Channapatna is India's toy town, known for lacquered wooden toys." },
      farm: null,
      inland: [[77.59, 12.97], [79.13, 12.92]],
      port: { name: "Chennai port", sub: "Tamil Nadu", ll: [80.30, 13.10] }, lane: "chennai",
      airport: { name: "Bengaluru airport", code: "BLR", ll: [77.71, 13.20] },
      tm: ["28", "Games, toys and playthings"],
      hs: ["9503.00", "toys"],
      fit: [["Small and light", 1], ["Hard to break", 1], ["Not too cheap", 1], ["Few rules abroad", 0]],
      pick: "Light, sturdy and well priced, but it is for children, so it must pass a US lab test.",
      brand: "Engrave or stamp the brand into the wood, and print it on the box.",
      rules: {
        level: "Strict", gated: true,
        pin: { name: "CPSC", sub: "Bethesda, Maryland · children's products", ll: [-77.10, 38.99] },
        line: "An approved lab tests the toy against the US standard. Then you sign a Children's Product Certificate.",
        items: ["A test by an approved lab against the US toy standard, ASTM F963", "A Children's Product Certificate (CPC) that you issue", "A permanent tracking label on the toy and its box"]
      },
      keywords: "Write for what US parents type, like “Montessori wooden toys”.",
      claims: null, extraIndia: null,
      shipNote: "Keep the lab report and CPC ready. Customs or Amazon can ask for them.",
      price: { price: 29.99, unit: "one toy", cost: 650, ship: 1.4, duty: 20, ref: 15, fba: 5.2, ads: 3, conv: 2, fx: 88 }
    }
  };

  // Break it: what goes wrong when a step is skipped. "at" names a pin; "stop" freezes the goods there.
  G.BREAKS = [
    { id: "tm", step: 3, title: "Skip the US trademark", at: "customer", label: "COPYCAT LISTING",
      what: "Anyone can list copies under your brand name. Without a trademark you cannot join Brand Registry, so you cannot get them taken down.",
      fix: "File with the USPTO before you print a single label. A pending application is enough for Amazon." },
    { id: "lut", step: 4, title: "Skip the LUT promise letter", at: "portin", label: "IGST PAID UPFRONT",
      what: "You pay IGST on every shipment before it leaves, then wait months for the refund. On a first order, that cash is gone just when you need it.",
      fix: "File the LUT (form GST RFD-11) on the GST portal. It is free. Renew it every April." },
    { id: "w8", step: 5, title: "Skip the W-8BEN tax interview", at: "customer", label: "UP TO 30% HELD BACK", money: "on",
      what: "Amazon may hold back up to 30 percent of every payout for US tax.",
      fix: "Finish the tax interview in Seller Central. It fills in the W-8BEN for you." },
    { id: "sticker", step: 6, title: "Put the brand on a sticker", at: "maker", label: "BRAND REGISTRY: REJECTED",
      what: "Amazon wants the brand permanently on the product. A paper sticker does not count, so no A+ Content, no Vine, and no copycat takedowns.",
      fix: "Print, engrave, weave or mould the brand into the product or its box, then photograph it." },
    { id: "rules", step: 7 },
    { id: "ior", step: 9, title: "Leave nobody as Importer of Record", at: "portus", label: "STUCK AT THE PORT", stop: 2,
      what: "Amazon never plays this role. The shipment sits at the port running up storage fees, then gets sent back or destroyed.",
      fix: "Be the importer yourself, with a US tax number and a customs bond, or pay a broker. Ask your forwarder for a DDP quote." },
    { id: "reviews", step: 10, title: "Buy a few fake reviews", at: "customer", label: "ACCOUNT CLOSED", money: "frozen",
      what: "Amazon closes accounts for this, permanently, with the money inside frozen.",
      fix: "Use Amazon Vine and the Request a Review button. Both are allowed." },
    { id: "fira", step: 11, title: "Take payouts in someone else's name", at: "maker", label: "SHIPMENT STILL OPEN", money: "on",
      what: "A bank receipt (FIRA) in a payment company's name does not close your shipment. It stays open with the central bank, and that can block future shipments.",
      fix: "Make sure every FIRA shows your own business name." }
  ];
  G.RULE_BREAKS = {
    cushion: { title: "Ship without the right label", at: "portus", label: "HELD AT CUSTOMS", stop: 2,
      what: "Every US import must say “Made in India”, and textiles need a fibre label. Customs can seize or destroy a shipment that fails labelling rules.",
      fix: "Sew in a label with the fibre, washing care and “Made in India” before the batch leaves the factory." },
    pepper: { title: "Ship food without the FDA steps", at: "portus", label: "HELD FOR THE FDA", stop: 2,
      what: "Food from an unregistered facility, or without Prior Notice, is held at the port and can be refused or destroyed. That is your whole batch and your freight money.",
      fix: "Register the packing facility with the FDA, name a US Agent, and have your broker file Prior Notice for every shipment." },
    toy: { title: "Skip the lab test and the CPC", at: "fba", label: "TOY CATEGORY LOCKED",
      what: "Amazon will not open the toy category until it sees the test report and the Children's Product Certificate. Your stock has nowhere to go.",
      fix: "Test with an approved lab against ASTM F963, issue the CPC, and add tracking labels." }
  };
})(window.G);
