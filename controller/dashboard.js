const Order = require("../model/order");
const axios = require("axios");

const getdashboarddata = async (req, res) => {

  try {

    // USD TO INR CONVERSION

    let USD_TO_INR = 97.5;

    try {

      const currencyResponse = await axios.get(
        "https://open.er-api.com/v6/latest/USD"
      );

      USD_TO_INR =
        currencyResponse.data?.rates?.INR || 97.5;

    } catch (currencyError) {

      console.log(
        "Currency API Error:",
        currencyError.message
      );

      USD_TO_INR = 97.5;
    }

    // TOTAL ORDERS

    const totalOrders =
      await Order.countDocuments();

    // TOTAL REVENUE
    // ONLY COMPLETED ORDERS

    const totalRevenueAgg =
      await Order.aggregate([

        {
          $match: {
            status: {
              $regex: "^completed$",
              $options: "i"
            }
          }
        },

        {
          $group: {

            _id: null,

            total: {
              $sum: {
                $convert: {
                  input: "$amount",
                  to: "double",
                  onError: 0,
                  onNull: 0
                }
              }
            }

          }
        }

      ]);

    const totalRevenueUSD =
      totalRevenueAgg.length > 0
        ? totalRevenueAgg[0].total
        : 0;

    // USD TO INR
    const totalRevenueINR =
    totalRevenueUSD;

    // PROFIT

    const PROFIT_PERCENTAGE = 30;

    const totalProfit =
      totalRevenueINR *
      (PROFIT_PERCENTAGE / 100);

    // USERS

    const users =
      await Order.distinct("username");

    // MONTHLY REVENUE

    const currentMonth =
      new Date().getMonth() + 1;

    const currentYear =
      new Date().getFullYear();

    const monthlyRevenueAgg =
      await Order.aggregate([

        {
          $match: {
            status: {
              $regex: "^completed$",
              $options: "i"
            }
          }
        },

        {
          $addFields: {

            createdMonth: {
              $month: "$createdAt"
            },

            createdYear: {
              $year: "$createdAt"
            }

          }
        },

        {
          $match: {
            createdMonth: currentMonth,
            createdYear: currentYear
          }
        },

        {
          $group: {

            _id: null,

            total: {
              $sum: {
                $convert: {
                  input: "$amount",
                  to: "double",
                  onError: 0,
                  onNull: 0
                }
              }
            }

          }
        }

      ]);

    const monthlyRevenue =
      monthlyRevenueAgg.length > 0
        ? monthlyRevenueAgg[0].total * USD_TO_INR
        : 0;

    // CHART DATA

    const chartdata =
      await Order.aggregate([

        {
          $match: {
            status: {
              $regex: "^completed$",
              $options: "i"
            }
          }
        },

        {
          $group: {

            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt"
              }
            },

            revenue: {
              $sum: {
                $convert: {
                  input: "$amount",
                  to: "double",
                  onError: 0,
                  onNull: 0
                }
              }
            }

          }
        },

        {
          $sort: { _id: 1 }
        }

      ]);

    const formattedChart =
      chartdata.map((item) => ({

        name: item._id,

        revenue: Number(
          (
            item.revenue *
            USD_TO_INR
          ).toFixed(2)
        ),

        profit: Number(
          (
            item.revenue *
            USD_TO_INR *
            0.3
          ).toFixed(2)
        )

      }));

    // ORDER STATUS

    const completedOrders =
      await Order.countDocuments({

        status: {
          $regex: "^completed$",
          $options: "i"
        }

      });

    const pendingOrders =
      await Order.countDocuments({

        status: {
          $regex: "^pending$",
          $options: "i"
        }

      });

    const processingOrders =
      await Order.countDocuments({

        status: {
          $regex: "^processing$",
          $options: "i"
        }

      });

    const failedOrders =
      await Order.countDocuments({

        status: {
          $regex: "^failed$",
          $options: "i"
        }

      });

    // RECENT TRANSACTIONS

    const recentTransactions =
      await Order.find()
        .sort({ createdAt: -1 })
        .limit(10)
         .select(`
          orderId
      order_id
      transaction_id
      payment_id
      username
      amount
      inr_amount
      paymentMethod
      payment_method
      status
      createdAt
    `);

    // RESPONSE

    res.json({

      success: true,

      currency_rate: USD_TO_INR,

      // KPI DATA

      kpi: {

        orders: totalOrders,

        total: Number(
          totalRevenueINR.toFixed(2)
        ),

        users: users.length,

        profit: Number(
          totalProfit.toFixed(2)
        ),

        monthlyRevenue: Number(
          monthlyRevenue.toFixed(2)
        )

      },

      // FINANCE DATA

      finance: {

  totalRevenue: Number(
    totalRevenueINR.toFixed(2)
  ),

  netProfit: Number(
    totalProfit.toFixed(2)
  ),

  userBalances: Number(
    totalRevenueINR.toFixed(2)
  ),

  pendingDeposits: pendingOrders

},
      // ORDER STATUS

      orderStatus: {

        completed: completedOrders,

        pending: pendingOrders,

        processing: processingOrders,

        failed: failedOrders

      },

      // CHART DATA

      chart_data: formattedChart,

      // TRANSACTIONS

     transactions:
  recentTransactions.map((txn) => ({

    // REAL TRANSACTION ID
    id:
      txn.transaction_id ||
      txn.payment_id ||
      txn.order_id ||
      txn.orderId ||
      txn._id,

    // USER
    user:
      txn.username || "Unknown",

    // TYPE
    type:
      txn.payment_method
        ? "Deposit"
        : "Order",

    // REAL INR AMOUNT
    amount: Number(
      txn.inr_amount ||
      txn.amount ||
      0
    ),

    // REAL PAYMENT METHOD
    method:
      txn.payment_method ||
      txn.paymentMethod ||
      "Razorpay",

    // REAL STATUS
    status:
      txn.status || "Pending",

    // DATE
    date:
      txn.createdAt

  }))

  });

  } catch (error) {

    console.log(error);

    res.status(500).json({

      success: false,

      error: error.message

    });

  }

};

module.exports = {
  getdashboarddata
};