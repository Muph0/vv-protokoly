
function AB_bez_rizika()
{
    var meta = load_forms_meta();
    var form = load_form(meta.selected);

    var bez_rizika = [];
    var prostor = form.A1_prostor.split('_')[1];


    if ([1,2,3,4].includes(prostor))
    {
        return [5];
    }
    else
    {
        return [];
    }
}

AN_UVNITR = 'CHYBA:\tAN\nSluneční záření se ve vnitřních prostorách neposuzuje.';
