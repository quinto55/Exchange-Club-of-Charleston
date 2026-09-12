# exchangeclubofcharleston.org — Site Audit

Audited 2026-09-11 (live site: Chrome measurements, HTTP analysis of 27 pages, robots.txt and
sitemap). The current site runs on ClubRunner's "Impression" template (theme `S4-WhiteLightGreen`).

**44 findings — 8 broken · 14 costly · 22 polish.** Severity: *Broken* = doesn't work or shows
something false; *Costly* = works but loses money, members, traffic or trust; *Polish* = looks
dated or careless.

Root causes: the template was never finished (sample donate page, `google.com` placeholder
buttons, vendor YouTube channel, template lime green), and content has had no owner since 2024.

## Things that don’t work

1. **The donate buttons go nowhere** — *Broken.* All three DONATE buttons on `/page/donate` are ``. Clicking one just reloads the page. **There is no way to give online anywhere on the site.**
2. **The donate page is the platform’s sample content** — *Broken.* It lists a “Library Fund,” a “Local Food Bank Fund” and a “Haiti Water Project” with stock photos, plus the line “We use 100% of our funding for program expenses.” The same Haiti Water Project copy appears on an [unrelated Kiwanis club’s ClubRunner site](https://kiwanisstcatharines.com/page/donate) in Ontario. The club’s real causes (child-abuse prevention, scholarships, fair grants) are missing.
3. **Five buttons open google.com** — *Broken.* The Contact Us or Learn More buttons on the Coastal Carolina Fair, Food Court, Triple B, Americanism and Youth Programs pages still point to the template placeholder `http://www.google.com/`, and open it in a new tab.
4. **“Community Service” in the menu is a 404** — *Broken.* Programs of Service → Community Service returns a 404 that reads “Oops! Looks like you are trying to reach a page that does not exist.” The error page’s browser title says “Home Page.”
5. **7 of 8 homepage news cards have no picture** — *Broken.* The thumbnail files under `/tiny/` and `/thumb/` return 404 and the full-size images never swap in, so the cards show as empty white boxes. Only the fair-logo card loads. The browser counted 22 of the homepage’s 29 image elements as broken (carousel copies included).
6. **The Facebook feeds never load** — *Broken.* “Club Facebook Page” and “CCF Facebook Page” are meant to embed feeds. The embed script loads but never creates a feed frame, so visitors see bare URLs in quote boxes. One URL breaks mid-word: “…CharlestonS / C.”
7. **The YouTube icon goes to ClubRunner’s channel** — *Broken.* The footer icon links to a channel whose page title is “ClubRunner – YouTube,” which belongs to the software vendor, not the club.
8. **“Blue `&amp;` Gold Program” shows raw code** — *Polish.* The ampersand is double-encoded in the news carousel, so the literal text `&amp;` appears in the card title.

## Content: stale, wrong or missing

9. **The homepage doesn’t sell the fair** — *Costly.* The club’s own calendar lists the 2026 Coastal Carolina Fair for Oct 29 – Nov 8. Its biggest fundraiser gets **no ticket button, no dates in the hero and no fair banner** on the homepage, just a text line under Upcoming Events. The only ticket link on the whole site is an unlabeled image on the Fair page.
10. **The Fair page advertises last year’s dates** — *Broken.* The banner reads “Fair Under the Stars · Oct 30 – Nov 9.” Those are the Thursday-to-Sunday dates of the **2025** fair. The club’s calendar lists Oct 29 – Nov 8, 2026.
11. **“News and Updates” stopped in spring 2024** — *Costly.* Every homepage story is from March–May 2024, and the newest is “2024 Scholarships.” Photo albums from 2025 and 2026 exist, but none of that material has made it onto the homepage.
12. **The Triple B page still sells April 2025** — *Costly.* It opens with “April 16–20, 2025” and includes the typos “We are exited to announce” and “for you entertainment.”
13. **The Food Court page is from 2024 and has leftover placeholders** — *Polish.* It still reads “our 2024 Exchange Park Food Court.” A slideshow caption says “Type caption here,” and one image links to the unrelated `triplebcowboy.com`.
14. **Typo in the homepage’s largest headline** — *Polish.* “EXCHANGE **COVENENT** OF SERVICE.” The paragraph underneath spells “covenant” correctly.
15. **“Become a Member” has no way to become a member** — *Costly.* The page gives no dues, meeting expectations, application or form. The only next step is “Feel free to contact us.”
16. **All contact funnels to one officer; the directory is login-only** — *Costly.* The contact form’s page title is “Send Email to” one named officer (currently the President-Elect), so the form has to be re-pointed each year when officers change. On the Officers page every entry says “Please log in to view contact info.”
17. **Photo albums use raw folder names and aren’t in order** — *Polish.* “FairPictures2025-MemberStaffOther” and “SpringFestival2026-CitadelCadets” are listed between 2024 albums, with no date sorting.

## Navigation & layout

18. **Upcoming Events breaks out of the page grid** — *Polish.* It sits flush against the window’s left edge (0 px), while every other section starts inside the centred column, and the right two-thirds beside it are empty.
19. **Menu items duplicate each other under different names** — *Polish.* Three pairs of menu items lead to the same page: “Contact” and “Contact Us,” “Give” and “DONATE,” and “What is Exchange?” and “Become a Member.”
20. **“Members Only” in the public menu leads to a login wall** — *Polish.* It sits under About Us and sends visitors to a ClubRunner login screen. It’s also listed in the sitemap.
21. **On phones, DONATE is hidden in the menu** — *Costly.* The button only appears once the hamburger menu is opened. The mobile menu itself works, and nothing scrolls sideways at 390 px.
22. **The footer carries the vendor’s links** — *Polish.* “Powered by ClubRunner,” “Online Help” and “System Requirements” link to the vendor’s support pages, which are irrelevant to a fairgoer or a prospective member.
23. **The hero “carousel” has one slide but shows arrows** — *Polish.* Its previous and next arrows have no other slide to go to.

## Visual design

24. **The hero image is a Facebook cover photo** — *Costly.* The source image is 851 × 315 px, exactly Facebook’s cover size, stretched across the full window. That’s about 1.5× on a 1280-px laptop and more on bigger screens, so it looks soft. All of its text is baked into the image, and a stray white dot sits on the date line.
25. **The accent colour is the template’s lime green, not the club’s** — *Polish.* The theme file is `S4-WhiteLightGreen`, and its `#689f38` drives every button, link and form label. The club’s emblem is navy and gold; the fair’s is red, navy and gold.
26. **The Covenant block is highlighter neon** — *Polish.* The background is `#e7f731`, the all-caps heading is underlined so it reads like a link, and every line of body copy is bold. It clashes with the `#feb702` gold hero above it.
27. **Headings don’t match each other** — *Polish.* The side-by-side headings “CLUB FACEBOOK PAGE” and “CCF FACEBOOK PAGE” use different fonts and sizes (Open Sans 23 px vs. Trebuchet MS 28 px). Page titles also switch between ALL CAPS (“AMERICANISM”) and Title Case (“Youth Programs”).
28. **It looks like every other ClubRunner club site** — *Polish.* The header is the stock template: a 69-px logo, a small site name, and a search box plus Member Login in the top right. Nothing in it says fair, Charleston or a century of service.
29. **The Food Court page opens with full-width clip art** — *Polish.* A cartoon food truck takes up the whole first screen, in a style that matches nothing else on the site.
30. **Upcoming Events is an unformatted text list** — *Polish.* There are no date blocks. Some entries show a time (Oct 1, Nov 5: 12:00 PM) and others (Sep 17, Oct 8, Oct 15) don’t.
31. **The cookie banner covers the hero** — *Polish.* On a first visit, the consent box covers much of the hero’s lower-left quadrant on a laptop screen.

## Accessibility

32. **The green text fails contrast** — *Costly.* `#689f38` on white is **3.18 : 1**, and WCAG AA requires 4.5 : 1 for normal text. White text on the DONATE button has the same 3.18 : 1. The colour is used for every link, story title, event name and form label.
33. **Images lack alt text** — *Costly.* The hero image has no alt text. Story photos are marked `alt=""`, meaning decorative. The Facebook and YouTube icons have no alt text, so screen readers get no name for those links. The Triple B and Food Court galleries have about 254 and 258 images without alt text.
34. **The heading structure is broken** — *Costly.* The homepage’s first H1 is empty and its second is the Covenant; after that it jumps straight to H4, with no H2 or H3. The Triple B and Food Court pages each contain about 250 empty H1 tags (the gallery captions).
35. **Vague and duplicated links** — *Polish.* The footer uses “click here” as link text, and every story is linked twice in a row (image, then title).

## Search & sharing

36. **No page has a description or share preview** — *Costly.* None of the 27 pages checked has a meta description, and none has Open Graph or Twitter tags, so links shared to Facebook or by text show no chosen image or summary. The only metadata is an obsolete meta-keywords tag.
37. **The homepage title is “Home Page”** — *Costly.* `Home Page | Exchange Club of Charleston` is what Google shows, and it wastes the most valuable line on the site.
38. **Key facts exist only inside images** — *Costly.* Fair dates, ticket outlets and the club’s founding dates are pixels in banners, not text, so search engines and screen readers can’t read them.
39. **The sitemap is stale and messy** — *Polish.* It has 20 URLs, 3 of them listed twice. It includes the login-only page and leaves out every individual story. Every entry is dated 2025-08-06, and it uses `/Page/` while the site’s links use `/page/`.
40. **robots.txt is cluttered and doesn’t name the sitemap** — *Polish.* It contains 75 unexplained `Disallow: /NNNN` lines and no `Sitemap:` line.
41. **The www address serves a duplicate site** — *Polish.* `www.exchangeclubofcharleston.org` returns the full site instead of redirecting to the bare domain. The canonical tag limits the damage.

## Performance & platform

42. **The logo weighs 773 KB** — *Costly.* It’s a 920 × 870 PNG displayed at 69 × 65 px, and **over half of everything the homepage downloads** (about 1.4 MB). The phone home-screen icon adds another 64 KB.
43. **The script stack is from another decade** — *Polish.* The page has 32 script tags, including jQuery plus jQuery Migrate, jQuery UI 1.12.1 (which has published XSS advisories fixed in 1.13), Bootstrap 3.4.1 (end of life since 2019) and a shim for Internet Explorer 7. This is platform-level, and the club can’t patch it.
44. **Assets aren’t cached** — *Polish.* ClubRunner’s image, CSS and JS hosts send no `Cache-Control` header, only ETag and Last-Modified, so returning visitors’ browsers re-check every file.
