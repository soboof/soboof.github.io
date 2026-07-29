/* ═══════════════════════════════════════════════════════════════════════════
   THE HAND-WRITTEN PAGES — everything the <head> of each one needs.

   The body of each page lives in src/pages/<file>; this is the metadata that
   wraps it. `node build.js` renders src/pages/* through src/partials/head.html,
   header.html and footer.html and writes the finished page to `out`.

   Keeping the SEO block here rather than in the markup means the title and
   description lengths can be checked in one pass, and the shared chrome can
   never drift between pages again.

     title      46–55 characters — also used for og:title and twitter:title
     desc       120–165 characters — also og:description and twitter:description
     canonical  absolute, matching sitemap.xml
     current    which nav link gets .current, or null
     sys        the little status line top-left
   ═══════════════════════════════════════════════════════════════════════════ */

module.exports = {
  "index": {
    "out": "index.html",
    "title": "Soboof — 3D, Graphics &amp; Fabrication Design Studio · Leeuwarden",
    "desc": "A Leeuwarden design studio working in 3D, 2D graphics and fabrication — outside-the-box work made to be built with rather than bought.",
    "canonical": "https://soboof.com/",
    "ogImage": "https://soboof.com/assets/img/space-fox-01.jpg",
    "ogAlt": "Space Fox — a mirrored modular sculpture by Soboof",
    "css": "index.css",
    "current": null,
    "sys": "SOBOOF · STUDIO · LIVE",
    "ctaHref": "#contact",
    "ctaText": "Contact",
    "jsonld": "<script type=\"application/ld+json\">\r\n{\r\n  \"@context\": \"https://schema.org\",\r\n  \"@graph\": [\r\n    {\r\n      \"@type\": \"WebSite\",\r\n      \"@id\": \"https://soboof.com/#website\",\r\n      \"name\": \"Soboof\",\r\n      \"url\": \"https://soboof.com/\",\r\n      \"inLanguage\": \"en\",\r\n      \"publisher\": {\r\n        \"@id\": \"https://soboof.com/#studio\"\r\n      }\r\n    },\r\n    {\r\n      \"@type\": \"Organization\",\r\n      \"@id\": \"https://soboof.com/#studio\",\r\n      \"name\": \"Soboof\",\r\n      \"alternateName\": \"Mirbreak\",\r\n      \"url\": \"https://soboof.com/\",\r\n      \"logo\": \"https://soboof.com/assets/img/soboof-logo.svg\",\r\n      \"email\": \"mirbreak@soboof.com\",\r\n      \"founder\": {\r\n        \"@type\": \"Person\",\r\n        \"name\": \"Soby Farahat\",\r\n        \"alternateName\": \"Soboof\",\r\n        \"jobTitle\": \"Artist and designer\",\r\n        \"url\": \"https://soboof.com/about.html\",\r\n        \"email\": \"mirbreak@soboof.com\",\r\n        \"address\": {\r\n          \"@type\": \"PostalAddress\",\r\n          \"addressLocality\": \"Leeuwarden\",\r\n          \"addressCountry\": \"NL\"\r\n        },\r\n        \"sameAs\": [\r\n          \"https://www.instagram.com/soboof/\",\r\n          \"https://www.linkedin.com/in/soboof\",\r\n          \"https://www.facebook.com/sobooof\"\r\n        ]\r\n      },\r\n      \"address\": {\r\n        \"@type\": \"PostalAddress\",\r\n        \"addressLocality\": \"Leeuwarden\",\r\n        \"addressCountry\": \"NL\"\r\n      },\r\n      \"sameAs\": [\r\n        \"https://www.instagram.com/soboof/\",\r\n        \"https://www.linkedin.com/in/soboof\",\r\n        \"https://www.facebook.com/sobooof\"\r\n      ]\r\n    }\r\n  ]\r\n}\r\n</script>",
    "extraOg": [],
    "ogType": "website",
    "url": "/"
  },
  "mirbreak": {
    "out": "mirbreak/index.html",
    "title": "Soboof · Mirbreak — Mirrored Modular Sculptures",
    "desc": "Mirrored modular sculptures by Soboof. Hand-cut Ayeneh-Kari tiles on 3D-printed geometric bodies — reflections of architecture, cosmos, and the self.",
    "canonical": "https://soboof.com/mirbreak/",
    "ogImage": "https://soboof.com/assets/img/space-fox-01.jpg",
    "ogAlt": "Space Fox — a mirrored modular sculpture by Soboof",
    "css": "mirbreak.css",
    "current": "MIRBREAK",
    "sys": "SOBOOF · STUDIO · LIVE",
    "ctaHref": "#contact",
    "ctaText": "Contact",
    "jsonld": "<script type=\"application/ld+json\">\r\n{\r\n  \"@context\": \"https://schema.org\",\r\n  \"@graph\": [\r\n    {\r\n      \"@type\": \"CreativeWorkSeries\",\r\n      \"@id\": \"https://soboof.com/mirbreak.html#series\",\r\n      \"name\": \"Mirbreak\",\r\n      \"url\": \"https://soboof.com/mirbreak.html\",\r\n      \"description\": \"Mirrored modular sculptures. Hand-cut Ayeneh-Kari tiles on 3D-printed geometric bodies — reflections of architecture, cosmos, and the self.\",\r\n      \"inLanguage\": \"en\",\r\n      \"genre\": [\"Sculpture\", \"Geometric abstraction\"],\r\n      \"artMedium\": \"Hand-cut mirror on 3D-printed PLA\",\r\n      \"creator\": {\r\n        \"@type\": \"Person\",\r\n        \"name\": \"Soby Farahat\",\r\n        \"alternateName\": \"Soboof\",\r\n        \"jobTitle\": \"Artist and designer\",\r\n        \"url\": \"https://soboof.com/about.html\",\r\n        \"address\": {\r\n          \"@type\": \"PostalAddress\",\r\n          \"addressLocality\": \"Leeuwarden\",\r\n          \"addressCountry\": \"NL\"\r\n        }\r\n      },\r\n      \"publisher\": { \"@id\": \"https://soboof.com/#studio\" }\r\n    },\r\n    {\r\n      \"@type\": \"BreadcrumbList\",\r\n      \"itemListElement\": [\r\n        { \"@type\": \"ListItem\", \"position\": 1, \"name\": \"Soboof\", \"item\": \"https://soboof.com/\" },\r\n        { \"@type\": \"ListItem\", \"position\": 2, \"name\": \"Mirbreak\", \"item\": \"https://soboof.com/mirbreak.html\" }\r\n      ]\r\n    }\r\n  ]\r\n}\r\n</script>",
    "extraOg": [],
    "ogType": "website",
    "url": "/mirbreak/"
  },
  "printing-lab": {
    "out": "printing-lab/index.html",
    "title": "Printing Lab · Hand-Printing Kiosk | Soboof",
    "desc": "The Soboof Printing Lab: a hand-printing kiosk that travels. Its current project, Death Culture, prints linocut stamps on site with visitors taking part.",
    "canonical": "https://soboof.com/printing-lab/",
    "ogImage": "https://soboof.com/assets/img/death-culture/death-culture-og.jpg",
    "ogAlt": "Death Culture: linocut print of a cypress, bird and mountains by Soboof",
    "css": "printing-lab.css",
    "current": "PRINTING_LAB",
    "sys": "PRINTING LAB · 25 PRINTS · ONGOING",
    "ctaHref": "index.html#contact",
    "ctaText": "Contact",
    "jsonld": "<script type=\"application/ld+json\">\r\n{\r\n  \"@context\": \"https://schema.org\",\r\n  \"@graph\": [\r\n    {\r\n      \"@type\": [\r\n        \"CreativeWorkSeries\",\r\n        \"VisualArtwork\"\r\n      ],\r\n      \"name\": \"Death Culture\",\r\n      \"url\": \"https://soboof.com/printing-lab.html#death-culture\",\r\n      \"description\": \"An ongoing hand-printing kiosk performance. Linocut stamps of cypress, dogs, birds of prey and mountains are printed on site, with visitors placing the body bags on the paper.\",\r\n      \"image\": [\r\n        \"https://soboof.com/assets/img/death-culture/death-culture-og.jpg\",\r\n        \"https://soboof.com/assets/img/death-culture/death-culture-01.jpg\",\r\n        \"https://soboof.com/assets/img/death-culture/sky-bodybags-09.jpg\"\r\n      ],\r\n      \"creator\": [\r\n        {\r\n          \"@type\": \"Person\",\r\n          \"name\": \"Soby Farahat\",\r\n          \"alternateName\": \"Soboof\",\r\n          \"jobTitle\": \"Artist and designer\",\r\n          \"url\": \"https://soboof.com/about.html\",\r\n          \"email\": \"mirbreak@soboof.com\",\r\n          \"address\": {\r\n            \"@type\": \"PostalAddress\",\r\n            \"addressLocality\": \"Leeuwarden\",\r\n            \"addressCountry\": \"NL\"\r\n          },\r\n          \"sameAs\": [\r\n            \"https://www.instagram.com/soboof/\",\r\n            \"https://www.linkedin.com/in/soboof\",\r\n            \"https://www.facebook.com/sobooof\"\r\n          ]\r\n        },\r\n        {\r\n          \"@type\": \"Person\",\r\n          \"name\": \"Ju Bergman\",\r\n          \"jobTitle\": \"Artist\"\r\n        }\r\n      ],\r\n      \"artform\": \"Printmaking\",\r\n      \"artMedium\": \"Relief print (linocut) on paper\",\r\n      \"artworkSurface\": \"Paper\",\r\n      \"genre\": \"Political art\",\r\n      \"inLanguage\": \"en\",\r\n      \"keywords\": \"linocut, relief print, hand printing, performance, Iran, protest, cypress, body bags\"\r\n    },\r\n    {\r\n      \"@type\": \"BreadcrumbList\",\r\n      \"itemListElement\": [\r\n        {\r\n          \"@type\": \"ListItem\",\r\n          \"position\": 1,\r\n          \"name\": \"Soboof\",\r\n          \"item\": \"https://soboof.com/\"\r\n        },\r\n        {\r\n          \"@type\": \"ListItem\",\r\n          \"position\": 2,\r\n          \"name\": \"Printing Lab\",\r\n          \"item\": \"https://soboof.com/printing-lab.html\"\r\n        }\r\n      ]\r\n    }\r\n  ]\r\n}\r\n</script>",
    "extraOg": [
      "<meta property=\"og:image:width\" content=\"1200\">",
      "<meta property=\"og:image:height\" content=\"630\">"
    ],
    "ogType": "article",
    "url": "/printing-lab/"
  },
  "workshop": {
    "out": "workshop/index.html",
    "title": "Soboof · Creatieve Workshop — Make Your Own Mirror Sculpture",
    "desc": "A two-level workshop with Soboof: learn the Persian Ayeneh-Kari mirror craft and build your own MirBreak sculpture. Leeuwarden · English · 6–8 people.",
    "canonical": "https://soboof.com/workshop/",
    "ogImage": "https://soboof.com/assets/img/abstract-table-lamp-01.jpg",
    "ogAlt": "Abstract table lamp built from mirrored modular blocks",
    "css": "workshop.css",
    "current": "WORKSHOP",
    "sys": "WORKSHOP · BOOKINGS OPEN",
    "ctaHref": "#book",
    "ctaText": "Book a slot",
    "jsonld": "<script type=\"application/ld+json\">\r\n{\r\n  \"@context\": \"https://schema.org\",\r\n  \"@graph\": [\r\n    {\r\n      \"@type\": \"Course\",\r\n      \"name\": \"Creatieve Workshop — Ayeneh-Kari and MirBreak\",\r\n      \"description\": \"A two-level creative workshop: learn the Persian Ayeneh-Kari mirror craft, then build your own MirBreak sculpture. English, 6–8 participants, Leeuwarden.\",\r\n      \"url\": \"https://soboof.com/workshop.html\",\r\n      \"provider\": {\r\n        \"@id\": \"https://soboof.com/#studio\"\r\n      },\r\n      \"inLanguage\": \"en\",\r\n      \"educationalLevel\": \"Beginner to intermediate\",\r\n      \"teaches\": [\r\n        \"Ayeneh-Kari mirror mosaic\",\r\n        \"Modular geometric construction\"\r\n      ],\r\n      \"hasCourseInstance\": {\r\n        \"@type\": \"CourseInstance\",\r\n        \"courseMode\": \"onsite\",\r\n        \"maximumAttendeeCapacity\": 8,\r\n        \"inLanguage\": \"en\",\r\n        \"location\": {\r\n          \"@type\": \"Place\",\r\n          \"name\": \"Soboof studio\",\r\n          \"address\": {\r\n            \"@type\": \"PostalAddress\",\r\n            \"addressLocality\": \"Leeuwarden\",\r\n            \"addressCountry\": \"NL\"\r\n          }\r\n        }\r\n      }\r\n    },\r\n    {\r\n      \"@type\": \"BreadcrumbList\",\r\n      \"itemListElement\": [\r\n        {\r\n          \"@type\": \"ListItem\",\r\n          \"position\": 1,\r\n          \"name\": \"Soboof\",\r\n          \"item\": \"https://soboof.com/\"\r\n        },\r\n        {\r\n          \"@type\": \"ListItem\",\r\n          \"position\": 2,\r\n          \"name\": \"Workshop\",\r\n          \"item\": \"https://soboof.com/workshop.html\"\r\n        }\r\n      ]\r\n    }\r\n  ]\r\n}\r\n</script>",
    "extraOg": [],
    "ogType": "website",
    "url": "/workshop/"
  },
  "journal": {
    "out": "journal/index.html",
    "title": "Soboof · Journal — Field Notes from the Studio",
    "desc": "The Soboof journal: short writing on geometry, philosophy, mirror craft, and the thinking behind modular form. New entries when something is worth saying.",
    "canonical": "https://soboof.com/journal/",
    "ogImage": "https://soboof.com/assets/img/geometrical-mouse-01.jpg",
    "ogAlt": "Geometrical Mouse — mirrored sculpture by Soboof",
    "css": "journal.css",
    "current": "JOURNAL",
    "sys": "JOURNAL · ONGOING",
    "ctaHref": "#contact",
    "ctaText": "Contact",
    "jsonld": "<script type=\"application/ld+json\">\r\n{\r\n  \"@context\": \"https://schema.org\",\r\n  \"@graph\": [\r\n    {\r\n      \"@type\": \"Blog\",\r\n      \"name\": \"Soboof Journal\",\r\n      \"url\": \"https://soboof.com/journal.html\",\r\n      \"description\": \"Short writing on geometry, philosophy, mirror craft and modular form.\",\r\n      \"publisher\": {\r\n        \"@id\": \"https://soboof.com/#studio\"\r\n      },\r\n      \"author\": {\r\n        \"@type\": \"Person\",\r\n        \"name\": \"Soby Farahat\",\r\n        \"alternateName\": \"Soboof\",\r\n        \"jobTitle\": \"Artist and designer\",\r\n        \"url\": \"https://soboof.com/about.html\",\r\n        \"email\": \"mirbreak@soboof.com\",\r\n        \"address\": {\r\n          \"@type\": \"PostalAddress\",\r\n          \"addressLocality\": \"Leeuwarden\",\r\n          \"addressCountry\": \"NL\"\r\n        },\r\n        \"sameAs\": [\r\n          \"https://www.instagram.com/soboof/\",\r\n          \"https://www.linkedin.com/in/soboof\",\r\n          \"https://www.facebook.com/sobooof\"\r\n        ]\r\n      },\r\n      \"inLanguage\": \"en\"\r\n    },\r\n    {\r\n      \"@type\": \"BreadcrumbList\",\r\n      \"itemListElement\": [\r\n        {\r\n          \"@type\": \"ListItem\",\r\n          \"position\": 1,\r\n          \"name\": \"Soboof\",\r\n          \"item\": \"https://soboof.com/\"\r\n        },\r\n        {\r\n          \"@type\": \"ListItem\",\r\n          \"position\": 2,\r\n          \"name\": \"Journal\",\r\n          \"item\": \"https://soboof.com/journal.html\"\r\n        }\r\n      ]\r\n    }\r\n  ]\r\n}\r\n</script>",
    "extraOg": [],
    "ogType": "website",
    "url": "/journal/"
  },
  "about": {
    "out": "about/index.html",
    "title": "Soboof · About — Soby Farahat and the Design Studio",
    "desc": "Soby Farahat — designer and maker in Leeuwarden, NL. From Tehran to triangles: the story behind Soboof, a design studio working in 3D, graphics and fabrication.",
    "canonical": "https://soboof.com/about/",
    "ogImage": "https://soboof.com/assets/img/adam-01.jpg",
    "ogAlt": "Adam — mirrored sculpture by Soby Farahat",
    "css": "about.css",
    "current": null,
    "sys": "IDENTITY · ACTIVE",
    "ctaHref": "#contact",
    "ctaText": "Contact",
    "jsonld": "<script type=\"application/ld+json\">\r\n{\r\n  \"@context\": \"https://schema.org\",\r\n  \"@graph\": [\r\n    {\r\n      \"@type\": \"AboutPage\",\r\n      \"name\": \"About Soboof\",\r\n      \"url\": \"https://soboof.com/about.html\",\r\n      \"isPartOf\": {\r\n        \"@id\": \"https://soboof.com/#website\"\r\n      },\r\n      \"mainEntity\": {\r\n        \"@type\": \"Person\",\r\n        \"name\": \"Soby Farahat\",\r\n        \"alternateName\": \"Soboof\",\r\n        \"jobTitle\": \"Artist and designer\",\r\n        \"url\": \"https://soboof.com/about.html\",\r\n        \"email\": \"mirbreak@soboof.com\",\r\n        \"address\": {\r\n          \"@type\": \"PostalAddress\",\r\n          \"addressLocality\": \"Leeuwarden\",\r\n          \"addressCountry\": \"NL\"\r\n        },\r\n        \"sameAs\": [\r\n          \"https://www.instagram.com/soboof/\",\r\n          \"https://www.linkedin.com/in/soboof\",\r\n          \"https://www.facebook.com/sobooof\"\r\n        ]\r\n      },\r\n      \"inLanguage\": \"en\"\r\n    },\r\n    {\r\n      \"@type\": \"BreadcrumbList\",\r\n      \"itemListElement\": [\r\n        {\r\n          \"@type\": \"ListItem\",\r\n          \"position\": 1,\r\n          \"name\": \"Soboof\",\r\n          \"item\": \"https://soboof.com/\"\r\n        },\r\n        {\r\n          \"@type\": \"ListItem\",\r\n          \"position\": 2,\r\n          \"name\": \"About\",\r\n          \"item\": \"https://soboof.com/about.html\"\r\n        }\r\n      ]\r\n    }\r\n  ]\r\n}\r\n</script>",
    "extraOg": [],
    "ogType": "profile",
    "url": "/about/"
  }
};
