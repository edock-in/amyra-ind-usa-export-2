# Contributing

Thank you for helping more people in India learn to export.

## Who can change what

- **Anyone** can use, fork, copy, change and sell this page under the [MIT License](LICENSE). No permission is needed. Anyone can also open an issue to report a bug or an outdated rule.
- **Verified Edock users** can make changes to this repository itself, including the live page at [games.edock.io/amyra-ind-usa-export-2](https://games.edock.io/amyra-ind-usa-export-2).

## Getting access as a verified Edock user

1. Open an issue with the **Verified Edock contributor access** template.
2. Give your Edock username. Issues are public, so never post your email, phone number, PAN or any ID document.
3. An Edock maintainer checks that your Edock account is verified.
4. You are given write access to this repository.

Access ends if your Edock account is no longer verified, or if it is used to harm the project.

## Branches

- **`develop`** is where all work comes together. It is the default branch.
- **`main`** is the live page. Every change to `main` is published. `main` only changes through a merged pull request, and only the maintainer, [@065rshdeep](https://github.com/065rshdeep), can merge into it.

## Making a change

1. Create a branch from `develop` with a short name, such as `content/lut-renewal-date` or `fix/panel-overflow`.
2. Edit the files in `src/`. Most content lives in `src/data-products.js` and `src/data-content.js`.
3. Run `./build.sh` and commit both your `src/` changes and the rebuilt `index.html` and `artifact.html`. A check on every pull request fails if the built files are out of date.
4. Open a pull request into `develop` and fill in the checklist.
5. Another verified contributor reviews it and merges it into `develop`.

## Releasing

When `develop` is ready, a pull request from `develop` into `main` is opened. The maintainer reviews it and merges it, and the page is published.

## House rules

- **Plain words first.** Write for someone who has never exported anything. One idea per caption. Official terms come after the idea.
- **Rupees next to dollars.** Any dollar amount people see that matters to them also shows its rupee value.
- **Cite a source for every fact.** When you change a rule, form, fee, deadline or duty rate, link an official source in the pull request. Good sources include DGFT, the GST portal, RBI, ICEGATE, USPTO, IRS, FDA, CPSC, US Customs and Border Protection, and Amazon Seller Central help pages.
- **Keep it one static page.** No image or audio files, no trackers and no analytics. The only network requests are Google Fonts, d3 and topojson from cdnjs, and the coastlines from jsDelivr, so the page keeps working inside hosts that block other sites.
- **Pin everything that comes from another site.** d3 and topojson carry an `integrity` hash in `build.sh`, and the coastlines are fetched as JSON with one in `src/tour.js`, so a changed file on a CDN is refused rather than run. games.edock.io shares a sign-in with every edock.io site, so nothing unpinned may run there. When you bump a version, update its hash.
- **Collect nothing.** The page stores choices only in the visitor's own browser and never sends personal data anywhere. Links to edock.io carry campaign tags, built by `tagged()` in `src/app.js`. Keep them, so Edock can see which game sent each visitor.
- **Glass for controls, not content.** The frosted glass look belongs to things you press (the top bar, the dock, the story controls) and the side panel. Content inside them sits on plain fills. Check both light and dark themes.
- **Test before you ask for review.** Play the story end to end. Try each product, by sea and by air, in light and dark, at phone width and on a desktop.

## Reporting outdated information

Rules and fees change. If you spot something out of date, open an issue with the **Outdated rule or number** template and include an official source.

## Be kind

Be respectful in issues and reviews. Maintainers may remove comments or access for harassment, spam or bad-faith changes.
