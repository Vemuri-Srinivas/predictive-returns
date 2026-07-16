@path: '/api'
service PredictService {
    action predict(
        customer_type           : String,
        material_group          : String,
        price                   : Decimal,
        size                    : String,
        discount                : Decimal,
        quantity                : Integer,
        season                  : String,
        brand                   : String,
        channel                 : String,
        customer_purchase_count : Integer
    ) returns {
        return_risk_prob : Decimal;
        return_risk_flag : Integer;
    };
}
