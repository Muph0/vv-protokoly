SELECT Nazev, Vlivy, 
(
    SELECT GROUP_CONCAT(
        (
            SELECT GROUP_CONCAT(masky.Mask SEPARATOR ', ')
            FROM Opatreni masky
            WHERE masky.TextID = uniq_id.TextID
              AND Vlivy LIKE CONCAT('%', masky.Mask, '%')
        ),
        ' - ', uniq_id.TextID 

        SEPARATOR '\n'
    )
    FROM 
    (
        SELECT DISTINCT inner_uniq_id.TextID
        FROM Opatreni inner_uniq_id
    ) uniq_id
) AS 'Opatreni'
FROM Protokol