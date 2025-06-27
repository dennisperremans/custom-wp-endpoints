<?php
class CWE_Endpoints_DB {
    const TABLE_NAME = 'custom_wp_endpoints';

    public function __construct() {
        register_activation_hook( __FILE__, [ $this, 'activate' ] );
    }

    public function activate() {
        global $wpdb;
        $table_name = $wpdb->prefix . self::TABLE_NAME;
        $charset_collate = $wpdb->get_charset_collate();

        $sql = "CREATE TABLE IF NOT EXISTS $table_name (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            endpoint_slug VARCHAR(191) NOT NULL,
            post_type VARCHAR(191) NOT NULL,
            query_args LONGTEXT NOT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY endpoint_slug (endpoint_slug)
        ) $charset_collate;";

        require_once ABSPATH . 'wp-admin/includes/upgrade.php';
        dbDelta( $sql );
    }
}
