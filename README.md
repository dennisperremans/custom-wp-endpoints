# Custom WP Endpoints

Create and manage **unlimited custom REST API endpoints** for any post type—without touching code.  
The plugin ships with an intuitive admin UI, a DataTable of endpoints, a visual Query-Builder (operators `!=`, `LIKE`, `IN`, …), and a Settings page where you can pick your own REST namespace.

---

## Table of Contents
1. Features  
2. Installation  
3. Quick Start  
4. Admin UI  
5. Query Builder  
6. Settings Page  
7. REST Responses  
8. Developers  
9. Changelog  

---

## 1  Features
* Unlimited endpoints (one per row) - by any post type.  
* Sortable/filterable endpoint list (DataTables).  
* Inline slug editing & instant deletion.  
* AJAX Query-Builder dialog  
  * add any `WP_Query` parameter or post-meta filter  
  * choose operators `= != > >= < <= IN NOT IN LIKE NOT LIKE`.  
* Custom REST namespace (e.g. `/wp-json/**myapi/v1**/slug`) — changeable in **Settings**.  
* Settings API integration (single option row `cwe_settings`).  
* Dynamic route registration — routes respect the namespace on every request.  
* No-code workflow — everything happens inside the WP dashboard.

---

## 2  Installation
1. Upload the folder to `/wp-content/plugins/custom-wp-endpoints/`  
2. Activate via *Plugins → Installed Plugins*  
3. Open **Custom Endpoints** in the admin menu.

---

## 3  Quick Start
1. **Create** — pick a post type → click **Add Endpoint** → a slug such as `event-6pwxmv` appears.  
2. **Filter** — click **Query** → add rows (e.g. `venue_name != Metastadt`) → **Save**.  
3. **Fetch** — call  

       https://example.com/wp-json/custom/v1/event-6pwxmv

---

## 4  Admin UI
| Column           | Description |
|------------------|-------------|
| **Slug**         | Endpoint slug (click **Edit** to rename). |
| **Post Type**    | Source post type. |
| **Endpoint URL** | Full REST URL reflecting the namespace. |
| **Actions**      | **Query** · **View** · **Edit** · **Delete** |

---

## 5  Query Builder
Rows contain **Key → Operator → Value**.

*Key* can be any `WP_Query` parameter (e.g. `posts_per_page`) **or** post-meta key (e.g. `venue_name`).  
Supported **operators**: `= != > >= < <= IN NOT IN LIKE NOT LIKE`.

Example saved JSON:

    {
      "posts_per_page": 5,
      "venue_name": { "!=": "Metastadt" },
      "country":     { "IN": "AT,DE" }
    }

---

## 6  Settings Page  
*Menu → Custom Endpoints → Settings*

| Setting | Description |
|---------|-------------|
| **REST Namespace** | Prefix after `/wp-json/` (default `custom/v1`). |
| **Default posts_per_page** | Used if an endpoint omits `posts_per_page` (default `-1`). |

Changing the namespace immediately re-registers routes and updates the UI.

---

## 7  REST Responses
`GET /wp-json/{namespace}/{slug}` returns:

    [
      {
        "id"   : 123,
        "title": "Gig at Metastadt",
        "slug" : "gig-at-metastadt",
        "meta" : { "venue_name": ["Metastadt"], "country": ["AT"] },
        "link" : "https://example.com/gig/gig-at-metastadt/"
      }
    ]

Endpoints are public (`permission_callback => __return_true`). Change in `class-endpoints-rest.php` if needed.

---

## 8  Developers
**Core classes**  
• `custom-wp-endpoints.php` – bootstrap / constants  
• `class-endpoints-db.php` – activation + DB table  
• `class-endpoints-admin.php` – admin UI, Settings, AJAX  
• `class-endpoints-rest.php` – dynamic routes + query execution  

**Assets**  
• `assets/js/admin.js` – DataTable & Query-Builder (jQuery UI Dialog)  
• `assets/css/admin.css` – light styling  

**DB schema**

    id BIGINT PK | endpoint_slug | post_type | query_args LONGTEXT | created_at

Hook into actions like `cwe_add_endpoint`, `cwe_save_query`, etc.

---

## 9  Changelog
### 1.2.0
* Operator support in Query-Builder (`!=`, `LIKE`, `IN`, etc.).  
* REST namespace pulled dynamically from settings.  

### 1.1.0
* Added Settings sub-page (namespace & default ppp).  
* Introduced Query-Builder modal (key/value).  

### 1.0.0
* Initial release – create / list / delete endpoints.

---

**Author:** Dennis Perremans  
