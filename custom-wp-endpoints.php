<?php
/**
 * Plugin Name: Custom WP Endpoints
 * Description: Create unlimited custom REST API endpoints based on post types and queries.
 * Version: 1.2.0
 * Author: Dennis Perremans
 */

if ( ! defined( 'ABSPATH' ) ) exit;

define( 'CWE_PATH', plugin_dir_path( __FILE__ ) );
define( 'CWE_URL', plugin_dir_url( __FILE__ ) );
define( 'CWE_VERSION', '1.2.0' );


require_once CWE_PATH . 'includes/class-endpoints-db.php';
require_once CWE_PATH . 'includes/class-endpoints-rest.php';
require_once CWE_PATH . 'includes/class-endpoints-admin.php';

new CWE_Endpoints_DB();
new CWE_Endpoints_REST();
new CWE_Endpoints_Admin();
