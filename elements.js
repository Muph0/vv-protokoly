// Javascript

var observe;
if (window.attachEvent) {
    observe = function (element, event, handler) {
        element.attachEvent('on'+event, handler);
    };
}
else {
    observe = function (element, event, handler) {
        element.addEventListener(event, handler, false);
    };
}
function elements_init () {
    var text = document.getElementsByClassName('autosize')[0];
    text.style.maxWidth = $(text).width();
    function resize () {
        text.style.height = 'auto';
        text.style.height = text.scrollHeight+'px';
    }
    // 0-timeout to get the already changed text
    function delayedResize () {
        window.setTimeout(resize, 0);
    }
    observe(text, 'change',  resize);
    observe(text, 'cut',     delayedResize);
    observe(text, 'paste',   delayedResize);
    observe(text, 'drop',    delayedResize);
    observe(text, 'keydown', delayedResize);
    resize();

    $('#table_p input[type="radio"]').each(function(i, elem)
    {
        var $opt_button = $(elem);
        var $td = $opt_button.parents('td').first();

        $td.addClass('tdbutton');
        $td.click(function(){
            button_click_noinvoke($opt_button);
            var form = create_and_save_changes();
            write_meta_row(form, load_forms_meta().selected);
        });

        var $blue_td = $td.parent('tr').find('.bluebold').parents('td');
        if (!$blue_td.attr('myclick'))
        {
            $blue_td.attr('myclick', true);
            $blue_td.click(function() {
                $td.parent('tr').find('input[type="radio"]').each(function(i, elem) {
                    // uncheck all radios
                    elem.checked = false;
                });

                // update label
                update_label($opt_button);
                // save & update meta row
                var form = create_and_save_changes();
                write_meta_row(form, load_forms_meta().selected);
            });
        }
    });

    $('#table_p input[type="checkbox"]').click(function() {
        $(this).prop('checked', !$(this).prop('checked'));
    });

    $('#table_p input[type="checkbox"]').each(function(i, elem){

        var $check_button = $(elem);
        var $td = $check_button.parents('td').first();

        update_label($check_button);

        $td.addClass('tdbutton');
        $td.click(function()
        {
            button_click_noinvoke($check_button);
            var form = create_and_save_changes();
            write_meta_row(form, load_forms_meta().selected);
        });
    });

    $('#table_p input[type="text"], #table_p input[type="number"], #table_p textarea').on('keyup', function() {
        var form = create_and_save_changes();
        write_meta_row(form, load_forms_meta().selected);
    });

    $('#table_p select, #table_p input[type="number"]').click(function()
    {
        var form = create_and_save_changes();
        write_meta_row(form, load_forms_meta().selected);
    });

    $('button#novy_form').click(function() {
        clone_form(0);
    });
    $('button#clone_form').click(function() {
        var meta = load_forms_meta();
        clone_form(meta.selected);
    });
    $('button#export_forms').click(function() {

        var sql_query = create_forms_sql();

        var filename = $('#form_filename')[0].value;
        if (!filename)
            filename = $('#form_filename').attr('placeholder');

        download(filename, sql_query);
    });
    $('button#upload_forms').click(function() {
        var data = create_forms_data();

        var timerInterval;
        swal({
            title: 'Nahrávání...',
            onOpen: () => {
                swal.showLoading()
                timerInterval = setInterval(() => {
                    swal.getTitle().textContent = 'Nahrávání.' + '.'.repeat(Math.floor((new Date().getTime() / 250) % 3));
                    console.log(timerInterval);
                }, 100)

                $.cors({
                    method: 'POST',
                    url: 'http://vv.debian.int/import.php',

                    data: data,

                    success: function(result) {
                        console.log(result);
                        swal('Hotovo', '', 'success');
                    },
                    error: function(result) {
                        console.error(result);
                        swal('Připojení selhalo', '', 'error');
                    },
                    finished: function() {
                        clearInterval(timerInterval);
                    },

                })

            },
            onClose: () => {
                clearInterval(timerInterval);
            }
        }).then(() => clearInterval(timerInterval));
    });
    $('button#delete_form').click(function() {
        var meta = load_forms_meta();
        delete_form(meta.selected);
    });

    $('#elektro_rozbalen').parents('tr').click(function()
    {
        zabalit_elektro();
    });
}

function create_and_save_changes()
{
    var form = create_form();
    var meta = load_forms_meta();

    save_form(meta.selected, form);
    return form;
}

function button_click_noinvoke($button)
{
    if ($button.attr('type') === 'radio')
    {
        $button.prop('checked', true);
    }
    else if ($button.attr('type') === 'checkbox')
    {
        $button.prop('checked', !$button.prop('checked'));
    }

    update_label($button);
}
function update_label($button)
{
    if ($button.attr('type') === 'radio')
    {
        var $row = $button.parents('tr').first();
        var $bluebold = $row.find('span.bluebold').first();
        var number = $button.siblings('b').first().html();

        if (!$button.is(':checked')) number = '';

        var attr_name = 'defaultvalue';
        if (!$bluebold.attr(attr_name))
        {
            $bluebold.attr(attr_name, $bluebold.html());
        }

        $bluebold.html($bluebold.attr(attr_name) + number);
    }
    else if ($button.attr('type') === 'checkbox')
    {
        var $td = $button.parents('td').first();
        var $bluebold = $td.find('span.bluebold').first();

        var checked = $button.is(':checked');
        var hasClass = $bluebold.hasClass('off');
        if (checked === hasClass) {
            if (hasClass) {
                $bluebold.removeClass('off');
            } else {
                $bluebold.addClass('off');
            }
        }
    } else alert("Error!, wrong arguments in update_label()");
}

function create_meta_list(forms_meta)
{
    $('#tab_seznam tbody').html('');

    for (var i = 0; i < forms_meta.data.length; i++)
    {
        var display = forms_meta.data[i];

        if (display)
        {
            var form = load_form(i);

            var $tr = write_meta_row(form, i);
        }
    }

    select_meta_row(forms_meta.selected);
}
function write_meta_row(form, row_id)
{
    var $t_headers = $('#tab_seznam thead tr').children();
    var $tr = $('#tab_seznam tr#form_' + row_id);
    var t_cells = $tr.children();

    if (!$tr.length)
    {
        var tr = document.createElement('tr');
        tr.setAttribute('id', 'form_' + row_id);
        t_cells = [];

        for (var i = 0; i < $t_headers.length; i++)
        {
            t_cells[i] = document.createElement('td');
            t_cells[i].setAttribute('colspan', $t_headers[i].getAttribute('colspan'));

            tr.appendChild(t_cells[i]);
        }

        $(t_cells[0]).addClass('bluebold');

        $('#tab_seznam tbody')[0].appendChild(tr);
        $tr = $(tr);
        $tr.click(function (){
            var select_id = $('#tab_seznam tbody tr:hover').attr('id').split('_')[1];
            select_meta_row(select_id);
        });
    }

    t_cells[0].innerHTML = form.A0_cislo_protokolu;
    t_cells[1].innerHTML = form.A0_umisteni;
    t_cells[2].innerHTML = form.A0_mistnost;
    t_cells[3].innerHTML = '"' + export_form(form).join('";"') + '"';

    return $tr;
}

function clone_form(source)
{
    if (typeof source === 'undefined') source = 0;

    var meta = load_forms_meta();

    var destination = meta.data.length;

    meta.data[destination] = true;
    save_forms_meta(meta);

    var form = load_form(source);
    save_form(destination, form);

    write_meta_row(form, destination);
    select_meta_row(destination);
}
function select_meta_row(row_id)
{
    var $row = $('#tab_seznam tbody tr#form_' + row_id);
    $('#tab_seznam tbody tr').removeClass('selected');
    $row.addClass('selected');

    var meta = load_forms_meta();

    meta.selected = row_id + '';
    save_forms_meta(meta);

    var form = load_form(meta.selected)
    apply_form(form);

    if (row_id+'' === '0')
        $('button#delete_form').addClass('display-none');
    else
        $('button#delete_form').removeClass('display-none');

}
function zabalit_elektro()
{
    var $rows_to_hide = [];
    var $row = $('#elektro_zabalen').parents('tr');
    var zabalen = !$('#elektro_zabalen').hasClass('display-none');

    while (true)
    {
        $row = $row.next();
        if ($row.find('span[defaultvalue="AN"]').length)
            break;

        $rows_to_hide.push($row);
    }

    if (zabalen)
    {
        $('#elektro_zabalen').addClass('display-none');
        $('#elektro_rozbalen').removeClass('display-none');
    }
    else
    {
        $('#elektro_rozbalen').addClass('display-none');
        $('#elektro_zabalen').removeClass('display-none');
    }

    for ($row of $rows_to_hide)
    {
        if (zabalen)
            $row.removeClass('display-none');
        else
            $row.addClass('display-none');
    }
}