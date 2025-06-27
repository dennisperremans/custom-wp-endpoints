(function ($) {
    $(document).ready(function () {

        /* ----------  DataTable  ---------- */
        const $table = $('#cwe-endpoint-table').DataTable({
            pageLength: 10,
            autoWidth: false
        });

        /* ----------  helper: build endpoint URL ---------- */
        const makeUrl = slug => `${CWE.siteUrl}/wp-json/${CWE.restNamespace}/${slug}`;

        /* ----------  Add endpoint ---------- */
        $('#cwe-add-btn').on('click', function (e) {
            e.preventDefault();

            const postType = $('#cwe-post-type').val();

            $.post(CWE.ajaxUrl, {
                action: 'cwe_add_endpoint',
                nonce: CWE.nonce,
                post_type: postType
            }).done(res => {
                if (!res.success) { alert(res.data.message || 'Error'); return; }

                const slug = res.data.endpoint_slug;

                const row = $table.row.add([
                    `<strong>${slug}</strong>`,
                    res.data.post_type,
                    `<a href="${makeUrl(slug)}" target="_blank">${makeUrl(slug)}</a>`,
                    `
                        <button class="button query-endpoint">Query</button>
                        <button class="button view-endpoint">View</button>
                        <button class="button edit-endpoint">Edit</button>
                        <button class="button delete-endpoint">Delete</button>
                    `
                ]).draw(false).node();

                $(row).attr('data-id', res.data.id);
            });
        });

        /* ----------  VIEW endpoint ---------- */
        $('#cwe-endpoint-table').on('click', '.view-endpoint', function () {
            const id = $(this).closest('tr').data('id');

            $.post(CWE.ajaxUrl, {
                action: 'cwe_get_endpoint',
                nonce: CWE.nonce,
                id
            }).done(res => {
                if (res.success) {
                    alert(
                        'Slug: ' + res.data.endpoint_slug + '\n' +
                        'Type: ' + res.data.post_type + '\n' +
                        'Query: ' + JSON.stringify(res.data.query_args, null, 2)
                    );
                } else {
                    alert(res.data.message || 'Error');
                }
            });
        });

        /* ----------  DELETE endpoint ---------- */
        $('#cwe-endpoint-table').on('click', '.delete-endpoint', function () {
            const $row = $(this).closest('tr');
            const id = $row.data('id');
            if (!confirm('Delete this endpoint?')) return;

            $.post(CWE.ajaxUrl, {
                action: 'cwe_delete_endpoint',
                nonce: CWE.nonce,
                id
            }).done(res => {
                if (res.success) $table.row($row).remove().draw();
                else alert(res.data.message || 'Error');
            });
        });

        /* ----------  EDIT slug inline ---------- */
        $('#cwe-endpoint-table').on('click', '.edit-endpoint', function () {
            const $row = $(this).closest('tr');
            const data = $table.row($row).data();
            const current = $(data[0]).text();

            data[0] = `<input type="text" class="edit-slug" value="${current}">`;
            data[3] = `
                <button class="button save-endpoint">Save</button>
                <button class="button cancel-edit">Cancel</button>
            `;
            $table.row($row).data(data).draw(false);
        });

        $('#cwe-endpoint-table').on('click', '.cancel-edit', function () {
            revertRow($(this).closest('tr'));
        });

        $('#cwe-endpoint-table').on('click', '.save-endpoint', function () {
            const $row = $(this).closest('tr');
            const id = $row.data('id');
            const slug = $row.find('.edit-slug').val().trim();
            const type = $table.row($row).data()[1];
            if (!slug) return alert('Slug required');

            $.post(CWE.ajaxUrl, {
                action: 'cwe_edit_endpoint',
                nonce: CWE.nonce,
                id,
                endpoint_slug: slug
            }).done(res => {
                if (res.success) revertRow($row, slug, type);
                else alert(res.data.message || 'Error');
            });
        });

        function revertRow($row, slugOverride, typeOverride) {
            const data = $table.row($row).data();
            const slug = slugOverride || $(data[0]).text();
            const type = typeOverride || data[1];

            $table.row($row).data([
                `<strong>${slug}</strong>`,
                type,
                `<a href="${makeUrl(slug)}" target="_blank">${makeUrl(slug)}</a>`,
                `
                    <button class="button query-endpoint">Query</button>
                    <button class="button view-endpoint">View</button>
                    <button class="button edit-endpoint">Edit</button>
                    <button class="button delete-endpoint">Delete</button>
                `
            ]).draw(false);
        }

        /* ================================================================
           ============  QUERY BUILDER  (modal dialog)  ===================
           ================================================================ */

        // operators list
        const operators = ['=', '!=', '>', '>=', '<', '<=', 'IN', 'NOT IN', 'LIKE', 'NOT LIKE'];

        // append hidden dialog skeleton
        $('body').append(`
          <div id="cwe-query-dialog" style="display:none">
            <p>Add <code>WP_Query</code> arguments (key → operator → value).</p>
            <table id="cwe-query-table" class="widefat striped">
              <thead><tr><th>Key</th><th>Operator</th><th>Value</th><th></th></tr></thead>
              <tbody></tbody>
            </table>
            <button id="cwe-add-qrow" class="button">+ Add Row</button>
          </div>`);

        // updated row template with operator select
        const rowTpl = (k = '', op = '=', v = '') => `
          <tr>
            <td><input type="text" class="qkey" value="${k}"></td>
            <td>
              <select class="qop">
                ${operators.map(o => `<option value="${o}" ${o === op ? 'selected' : ''}>${o}</option>`).join('')}
              </select>
            </td>
            <td><input type="text" class="qval" value="${v}"></td>
            <td><button class="button remove-qrow">×</button></td>
          </tr>`;

        // open modal
        $('#cwe-endpoint-table').on('click', '.query-endpoint', function () {
            const $row = $(this).closest('tr');
            const id = $row.data('id');

            $.post(CWE.ajaxUrl, {
                action: 'cwe_get_endpoint',
                nonce: CWE.nonce,
                id
            }).done(res => {
                if (!res.success) return alert(res.data.message || 'Error');

                const args = res.data.query_args || {};
                const $tb = $('#cwe-query-table tbody').empty();

                // populate: check if value is object with operator or just string
                if (Object.keys(args).length) {
                    Object.entries(args).forEach(([k, v]) => {
                        if (typeof v === 'object' && v !== null) {
                            // e.g. v = { '!=': 'something' }
                            const [op, val] = Object.entries(v)[0];
                            $tb.append(rowTpl(k, op, val));
                        } else {
                            $tb.append(rowTpl(k, '=', v));
                        }
                    });
                } else {
                    $tb.append(rowTpl());
                }

                $('#cwe-query-dialog').dialog({
                    title: `Query args for “${res.data.endpoint_slug}”`,
                    modal: true,
                    width: 600,
                    buttons: {
                        Save() {
                            const obj = {};
                            $('#cwe-query-table tbody tr').each(function () {
                                const k = $(this).find('.qkey').val().trim();
                                const op = $(this).find('.qop').val();
                                const v = $(this).find('.qval').val().trim();

                                if (!k) return;

                                if (op === '=') {
                                    obj[k] = v;
                                } else {
                                    obj[k] = { [op]: v };
                                }
                            });

                            $.post(CWE.ajaxUrl, {
                                action: 'cwe_save_query',
                                nonce: CWE.nonce,
                                id,
                                query_args: JSON.stringify(obj)
                            }).done(r => {
                                if (r.success) $('#cwe-query-dialog').dialog('close');
                                else alert(r.data.message || 'Save error');
                            });
                        },
                        Cancel() { $(this).dialog('close'); }
                    }
                });
            });
        });

        // add/remove rows inside dialog
        $('#cwe-add-qrow').on('click', () => $('#cwe-query-table tbody').append(rowTpl()));
        $('#cwe-query-dialog').on('click', '.remove-qrow', function () {
            $(this).closest('tr').remove();
        });
    });
})(jQuery);
