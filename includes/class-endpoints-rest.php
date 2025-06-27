<?php
class CWE_Endpoints_REST {
    private $rest_namespace;

    public function __construct() {
        // Load REST namespace from settings, fallback to 'custom/v1'
        $settings = get_option('cwe_settings', []);
        $this->rest_namespace = !empty($settings['rest_namespace']) ? $settings['rest_namespace'] : 'custom/v1';

        add_action('rest_api_init', [$this, 'register_dynamic_routes']);
    }

    public function register_dynamic_routes() {
        register_rest_route($this->rest_namespace, '/(?P<slug>[a-zA-Z0-9-_]+)', [
            'methods'             => 'GET',
            'callback'            => [$this, 'handle_dynamic_endpoint'],
            'permission_callback' => '__return_true',
        ]);
    }

    public function handle_dynamic_endpoint(WP_REST_Request $request) {
        $slug = $request->get_param('slug');

        global $wpdb;
        $table = $wpdb->prefix . CWE_Endpoints_DB::TABLE_NAME;
        $row = $wpdb->get_row(
            $wpdb->prepare("SELECT * FROM $table WHERE endpoint_slug = %s", $slug),
            ARRAY_A
        );

        if (!$row) {
            return new WP_Error(
                'rest_no_route',
                'No route was found matching the URL and request method.',
                ['status' => 404]
            );
        }

        // Decode and prepare query args
        $saved_args = json_decode($row['query_args'], true) ?: [];

        // Recognized WP_Query arguments
        $recognized = [
            'post_type', 'posts_per_page', 'orderby', 'order',
            'meta_key', 'meta_value', 'meta_query',
            'tax_query', 's', 'paged'
        ];

        $query_args = [];
        $meta_query = [];

        foreach ($saved_args as $key => $value) {
            if (in_array($key, $recognized, true)) {
                $query_args[$key] = $value;
            } else {
                if (is_array($value)) {
                    foreach ($value as $operator => $val) {
                        $meta_query[] = [
                            'key'     => $key,
                            'value'   => $val,
                            'compare' => strtoupper($operator),
                        ];
                    }
                } else {
                    $meta_query[] = [
                        'key'     => $key,
                        'value'   => $value,
                        'compare' => '=',
                    ];
                }
            }
        }

        if ($meta_query) {
            if (isset($query_args['meta_query']) && is_array($query_args['meta_query'])) {
                $query_args['meta_query'] = array_merge($query_args['meta_query'], $meta_query);
            } else {
                $query_args['meta_query'] = $meta_query;
            }
        }

        // Apply defaults
        $args = wp_parse_args($query_args, [
            'post_type'      => $row['post_type'],
            'posts_per_page' => -1,
        ]);

        $query = new WP_Query($args);
        $posts = [];

        while ($query->have_posts()) {
            $query->the_post();
            $posts[] = [
                'id'    => get_the_ID(),
                'title' => get_the_title(),
                'slug'  => get_post_field('post_name', get_the_ID()),
                'meta'  => get_post_meta(get_the_ID()),
                'link'  => get_permalink(),
            ];
        }
        wp_reset_postdata();

        return rest_ensure_response($posts);
    }
}
