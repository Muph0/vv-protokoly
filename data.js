function create_form()
{
    var result = {};

    $('#table_p input[type="text"], #table_p input[type="number"]').each(function(i, elem)
    {
        var name = $(elem).attr('name');
        var value = $(elem)[0].value;

        result['A0_' + name] = value;
    });

    result.A2_vyuziti = $('textarea#vyuziti_area')[0].value;

    $('#table_p select > option:selected').each(function(i, elem){
        var name = $(elem).parent().attr('name');
        var value = $(elem).attr('value');

        result['A1_' + name] = value;
    });

    $('input[type="radio"]').each(function(i, elem)
    {
        var group = $(elem).attr('name');
        if (!(group in result))
        {
            var number = $(elem).parents('tr').find('input[type="radio"]:checked').siblings('b').html();
            result[group] = number;
        }
    });

    $('input[type="checkbox"]').each(function(i, elem)
    {
        var group = $(elem).attr('name');
        if (!(group in result))
        {
            var value = $(elem).parents('td').find('input[type="checkbox"]').is(':checked');
            result[group] = value;
        }
    });

    var alphabetic_result = {};

    var keys = Object.keys(result).sort(sort_AM);
    for (key of keys){
        if (result.hasOwnProperty(key)) {
            alphabetic_result[key] = result[key];
        }
    }

    console.log("Created form:");
    console.log(alphabetic_result);


    var vlivy = gen_vlivy(alphabetic_result);
    alphabetic_result.vlivy = vlivy;

    $('#lhuta')[0].innerHTML = alphabetic_result.vlivy.lhuta;
    $('#prostory')[0].innerHTML = alphabetic_result.vlivy.prostor;

    return alphabetic_result;
}


function apply_form(form)
{
    $('#table_p input[type="text"], #table_p input[type="number"]').each(function(i, elem)
    {
        var name = $(elem).attr('name');
        var value = form['A0_' + name];

        if (value)
        {
            if (Number.isFinite(value.split(',').join('.') * 1))
                elem.value = value.split(',').join('.') * 1;
            else
                elem.value = value;
        }
        else elem.value = '';            
    });

    $('textarea#vyuziti_area')[0].value = form.A2_vyuziti;

    $('#table_p select').each(function(i, elem){
        var name = $(elem).attr('name');
        var value = form['A1_' + name];

        if (value !== null && typeof value !== 'undefined')
        {
            var $option = $(elem).find('option[value="' +value+ '"]');
            
            $option[0].selected = true;
        }
    });

    $('input[type="radio"]').each(function(i, elem)
    {
        var group = $(elem).attr('name');
        var number = $(elem).siblings('b').html();
        elem.checked = false;

        if (number+"" === form[group]+"")
        {
            button_click_noinvoke($(elem));
        }
    });

    $('td[myclick="true"]').each(function(i, elem) {
        var $input = $(elem).parent('tr').find('input:checked').first();
        if (!$input.length)
            update_label($(elem).parent('tr').find('input').first());
    });

    $('input[type="checkbox"]').each(function(i, elem)
    {
        var group = $(elem).attr('name');
        var form_value = form[group];
        var checked_value = elem.checked;

        if (form_value != checked_value)
        {
            button_click_noinvoke($(elem));
        }
    });


    $('#lhuta')[0].innerHTML = form.vlivy.lhuta;
    $('#prostory')[0].innerHTML = form.vlivy.prostor;
    
}

function escape_CSV(str)
{
    if (typeof str === 'string')
        return str.split(';').join('.').split('\n').join('\\n');

    if (typeof str === 'boolean')
        return str ? 'true' : 'false';

    return 'undefined';
}

function dump(obj)
{
    var result = '{\n';
    var keys = Object.keys(obj).sort(sort_AM);
    for (key of keys){
        if (obj.hasOwnProperty(key)) {
            result += ('    ' + key + ': ' + obj[key] + '\n');
        }
    }
    result += '}';
    console.log(result);
}

function sort_AM(a, b)
{
    var regex = /([A-Z]+)([0-9]+)/;

    var match = regex.exec(a);
    if (match && match[2].length === 1)
    {
        a = match[1] + '0' + match[2];
    }
    match = regex.exec(b);
    if (match && match[2].length === 1)
    {
        b = match[1] + '0' + match[2];
    }

    return a > b ? 1 : -1;
}
function download(filename, text) {
  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}
function display_raw(text)
{
    document.location = 'data:text/plain;charset=utf-8,' + text;
}

function load_forms_meta()
{
    return $.jStorage.get("forms_meta");
}
function load_form(id)
{
    if (typeof id === 'undefined' || id === null) return console.error('Argument null exception.');
    var result = $.jStorage.get("form_" + id);

    // bw compatible
    if (result)
        result.A1_prostor = result.A1_prostor.split('_').reverse()[0];

    return result;
}
function save_forms_meta(metadata)
{
    if (!metadata) return console.error('Argument null exception.');
    $.jStorage.set("forms_meta", metadata);
}
function save_form(id, form)
{
    if (!form) return console.error('Argument null exception.');
    if (typeof id !== 'string' && typeof id !== 'number') console.error('Wrong Argument');
    $.jStorage.set("form_" + id, form);
}

function delete_form(form_id) 
{
    var meta = load_forms_meta();
    meta.data[form_id] = false;
    save_forms_meta(meta);
    create_meta_list(meta);
    select_meta_row(form_id*1 - 1);
}

function tonumber(value)
{
    if (Number.isFinite(value * 1))
        return value * 1;

    return value;
}

function gen_vlivy(form)
{
    var PROSTOR = ['NORMÁLNÍ', 'NEBEZPEČNÉ', 'ZVLÁŠŤ NEBEZPEČNÉ'];
    var vlivy = {bez_rizika: [], s_rizikem: [], lhuta: 5, prostor: PROSTOR[0]};

    scope = new EvalScope();
    for (key in form)
    {
        var var_name = key.split('-').join('_');

        var value = JSON.stringify(form[key]);
        if (Number.isFinite(form[key] * 1))
            value = form[key] * 1;

        scope.declare(var_name);
        var code = var_name + ' = ' + value + ';';

        try
        {
            scope.eval(code);
        }
        catch (e)
        {
            debugger;
            console.log(e);
        }
    }

    for (key in form)
    {
        if (/[A-C][A-Z]+.*/.test(key))
        {
            switch (typeof form[key])
            {
                case 'boolean':
                if (form[key]) veta.push(key);
                break;
                case 'string':
                case 'number':

                var vliv = key + form[key];
                var $radio = null;
                $('input[type="radio"][name="'+key+'"]').each(function (i, elem)
                {
                    if ($(elem).siblings('b').first().html() === form[key])
                        $radio = $(elem);
                });
                var $row = $radio.parents('tr');
                var hodnota = tonumber(form[key]);

                    ///
                    // RIZIKO
                    //
                    var attr_bez_rizika = $row.attr('bez_rizika');
                    var hodnoty_bez_rizika = null;

                    // <tr ... bez_rizika>
                    if (attr_bez_rizika === '')
                    {
                        hodnoty_bez_rizika = true;
                    }
                    // <tr ... >
                    else if (typeof attr_bez_rizika === 'undefined' || attr_bez_rizika === false)
                    {
                        hodnoty_bez_rizika = [];
                    }
                    // <tr ... bez_rizika="[...]">
                    else
                    {                        
                        hodnoty_bez_rizika = scope.eval(attr_bez_rizika);
                    }

                    if (hodnoty_bez_rizika === true || hodnoty_bez_rizika.indexOf(hodnota) > -1)                    
                        vlivy.bez_rizika.push(vliv);
                    else
                        vlivy.s_rizikem.push(vliv);                  

                    ///
                    // LHŮTA
                    //
                    var attr_lhuta = $radio.attr('lhuta');
                    if (attr_lhuta)
                    {
                        var lhuta = scope.eval(attr_lhuta);
                        if (typeof lhuta != 'number' || typeof lhuta == 'undefined')
                        {
                            console.error('Neplatná lhůta u vlivu ' + key + ', hodnota ' + hodnota);
                            //debugger;
                        }

                        if (lhuta < vlivy.lhuta)
                            vlivy.lhuta = lhuta;
                    }

                    ///
                    // PROSTOR
                    //
                    var attr_prostor = $radio.attr('prostor');
                    
                    if (attr_prostor)
                    {   
                        var prostor;        
                        if (PROSTOR.indexOf(attr_prostor) === -1)             
                            prostor = scope.eval(attr_prostor);
                        else
                            prostor = attr_prostor;

                        var prostor_index = PROSTOR.indexOf(prostor);
                        if (prostor_index === -1) console.log('Neplatný attribut "prostor" u vlivu ' + key + ', hodnota ' + hodnota);

                        if (prostor_index > PROSTOR.indexOf(vlivy.prostor))
                            vlivy.prostor = prostor;
                    }


                    break;
                }
            }
        }




    //console.log('vlivy:')
    //console.log(vlivy);

    return vlivy;
}

function get_option_text_by_value(name, value)
{
    return $('select[name="'+name+'"] option[value="'+value+'"]').html();
}
function get_option_value_by_text(name, text)
{
    var result = null

    $('select[name="'+name+'"] option').each(function (i, elem)
    {
        if (elem.innerHTML === text)
        {
            result = elem.value;
        }
    });

    return result;
}
function export_form(form)
{
    if (!form.vlivy)
    {
        //form.vlivy = {};
        console.error('BORDER! chybí zpracované vlivy')
    }

    return [
        3, // ID_budova
        form.A1_cast,    
        0, // ID_prostor
        form.A0_cislo_protokolu,
        form.A0_mistnost,
        form.A0_umisteni,
        form.A0_linie,        
        form.A2_vyuziti,
        get_option_text_by_value('prostor', form.A1_prostor),
        get_option_text_by_value('obsluha', form.A1_obsluha),
        get_option_text_by_value('osvetleni', form.A1_osvetleni),
        get_option_text_by_value('podlaha', form.A1_podlaha),
        get_option_text_by_value('steny', form.A1_steny),
        get_option_text_by_value('pozarni_ochrana', form.A1_pozarni_ochrana),
        get_option_text_by_value('vytapeni', form.A1_vytapeni),
        get_option_text_by_value('vetrani', form.A1_vetrani),
        form.A0_vymera,
        form.vlivy.bez_rizika,
        form.vlivy.s_rizikem,
        form.vlivy.prostor,
        form.vlivy.lhuta
    ];
}


function mysql_real_escape_string (str) {
    return str.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, function (char) {
        switch (char) {
            case "\0":
                return "\\0";
            case "\x08":
                return "\\b";
            case "\x09":
                return "\\t";
            case "\x1a":
                return "\\z";
            case "\n":
                return "\\n";
            case "\r":
                return "\\r";
            case "\"":
            case "'":
            case "\\":
            case "%":
                return "\\"+char; // prepends a backslash to backslash, percent,
                                  // and double/single quotes
        }
    });
}
function escape_sql_value(value)
{
    if (Number.isFinite(value * 1))
    {
        return value * 1;
    }
    if (typeof value === 'string')
    {
        return "'" + mysql_real_escape_string(value) + "'";
    }
    if (value === null)
    {
        return 'NULL';
    }
    if (Object.prototype.toString.call( value ) === '[object Array]')
    {
        return escape_sql_value(value.join(', '));
    }

    throw new {message: "SQL unknown value:", value: value};
}

function download_forms_sql()
{
    var meta = load_forms_meta();
    var result = "INSERT INTO Protokol\r\n\r\n" +
    "(ID_budova,  ID_cast,  ID_prostor,  Cleneni,  Popis,     Oznaceni_umisteni,  Vyrobni_linie,      Vyuziti_prostoru_plochy,\r\n" +
    " Prostor,    Obsluha,  Osvetleni,   Podlaha,  Steny,     Pozarni_ochrana,    Vytapeni_chlazeni,  Vetrani,Vymera,\r\n" +
    " Vlivy_bez_rizika,     Vlivy_s_rizikem,       Prostory,  Revizni_lhuta)" +
    "\r\n\r\n    VALUES\r\n\r\n";

    for (form_id in meta.data)
    {
        var display = meta.data[form_id];
        if (display)
        {
            var form = load_form(form_id);
            var values = export_form(form).map(escape_sql_value);

            var line = '(' + values.join(', ') + '),\r\n'
            result += line;
        }
    }

    var filename = $('#form_filename')[0].value;
    if (!filename)
        filename = $('#form_filename').attr('placeholder');

    download(filename, result);
}


function import_all_forms(str)
{
    var forms = CSVToArray(str.split('; ').join(';'));
    //console.log(forms);

    for (var line of forms)
    {
        if (line.length === 22)
            import_form(line);
        else
        {
            console.error("Wrong line length");
            console.log(line);
        }
    }

    document.location.reload();
}

function import_form(data)
{
    for (var i = 0; i < data.length; i++)
    {
        data[i] = data[i] || '';
    }    
    //console.log(data);

    var form = {};

    //3, // ID_budova
    form.A1_cast = data[1];
    //0, // ID_prostor
    form.A0_cislo_protokolu = data[3];
    form.A0_mistnost = data[4];
    form.A0_umisteni = data[5];
    form.A0_linie = data[6];
    form.A2_vyuziti = data[7];
    form.A1_prostor = get_option_value_by_text('prostor', data[8]);
    form.A1_obsluha = get_option_value_by_text('obsluha',data[9]);
    form.A1_osvetleni = get_option_value_by_text('osvetleni',data[10]);
    form.A1_podlaha = get_option_value_by_text('podlaha',data[11]);
    form.A1_steny = get_option_value_by_text('steny',data[12]);
    form.A1_pozarni_ochrana = get_option_value_by_text('pozarni_ochrana',data[13]);
    form.A1_vytapeni = get_option_value_by_text('vytapeni',data[14]);
    form.A1_vetrani = get_option_value_by_text('vetrani',data[15]);
    form.A0_vymera = data[16];
    
    //vlivy.bez_rizika,
    //vlivy.s_rizikem,
    var vlivy = data[17] + ',' + data[18];

    $('input[type="radio"]').each(function(i, elem)
    {
        var group = $(elem).attr('name');
        var regex = new RegExp(group + '([^,]+)');

        if (!(group in form))
        {
            var number = regex.exec(vlivy);
            if (number)
                number = number[1];
            else
                number = undefined;

            form[group] = number;
        }
    });

    $('input[type="checkbox"]').each(function(i, elem)
    {
        var group = $(elem).attr('name');
        var regex = new RegExp(group);

        if (!(group in form))
        {
            var value = regex.test();
            form[group] = value;
        }
    });

    //vlivy.prostor,
    //vlivy.lhuta,
    //null, // Opatření

    form.vlivy = gen_vlivy(form);

    //console.log(form);/*    

    var meta = load_forms_meta();
    var id = meta.data.length;
    meta.data.push(true);

    save_form(id, form);
    save_forms_meta(meta);//*/
}


// NESROVNALOSTI:
// AAx neni po změně formuláře změněno na AA
//

// VYŘEŠENO:
// apply_form dělá neplechu v row_selectu (checkboxy jsou zpomalený)