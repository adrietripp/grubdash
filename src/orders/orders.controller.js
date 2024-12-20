const path = require("path");
const orders = require(path.resolve("src/data/orders-data"));
const nextId = require("../utils/nextId");

//middleware
function orderExists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    return next();
  }
  next({ status: 404, message: `Order does not exist: ${orderId}.` });
}

function bodyHasDeliverTo(req, res, next) {
  const { data: { deliverTo } = {} } = req.body;
  if (!deliverTo || deliverTo === "") {
    return next({ status: 400, message: "Order must include a deliverTo" });
  }
  next();
}

function bodyHasMobileNumber(req, res, next) {
  const { data: { mobileNumber } = {} } = req.body;
  if (!mobileNumber || mobileNumber === "") {
    return next({ status: 400, message: "Order must include a mobileNumber" });
  }
  next();
}

function bodyHasDishes(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  if (!dishes || !Array.isArray(dishes) || dishes.length === 0) {
    return next({ status: 400, message: "Order must include at least one dish" });
  }
  res.locals.dishes = dishes;
  next();
}

function dishesHaveValidQuantity(req, res, next) {
  const { dishes } = res.locals;
  for (let i = 0; i < dishes.length; i++) {
    const dish = dishes[i];
    if (!dish.quantity || dish.quantity <= 0 || !Number.isInteger(dish.quantity)) {
      return next({
        status: 400,
        message: `Dish ${i} must have a quantity that is an integer greater than 0`,
      });
    }
  }
  next();
}

function validateIdMatch(req, res, next) {
  const { orderId } = req.params;
  const { data: { id } = {} } = req.body;
  if (id && id !== orderId) {
    return next({
      status: 400,
      message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.`,
    });
  }
  next();
}

function validateStatus(req, res, next) {
  const { data: { status } = {} } = req.body;
  if (!status || status === "" || !["pending","preparing","out-for-delivery","delivered"].includes(status)) {
    return next({ status: 400, message: "Order must have a status of pending, preparing, out-for-delivery, delivered" });
  }

  if (res.locals.order && res.locals.order.status === "delivered") {
    return next({ status: 400, message: "A delivered order cannot be changed" });
  }
  next();
}

// Handlers
function list(req, res) {
  res.json({ data: orders });
}

function create(req, res) {
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  const newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    status: status || "pending",
    dishes,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function read(req, res) {
  res.json({ data: res.locals.order });
}

function update(req, res) {
  const order = res.locals.order;
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;

  order.deliverTo = deliverTo;
  order.mobileNumber = mobileNumber;
  order.status = status;
  order.dishes = dishes;

  res.json({ data: order });
}

function destroy(req, res, next) {
  const order = res.locals.order;
  if (order.status !== "pending") {
    return next({ status: 400, message: "An order cannot be deleted unless it is pending" });
  }
  const index = orders.findIndex((o) => o.id === order.id);
  orders.splice(index, 1);
  res.sendStatus(204);
}

module.exports = {
  list,
  create: [bodyHasDeliverTo, bodyHasMobileNumber, bodyHasDishes, dishesHaveValidQuantity, create],
  read: [orderExists, read],
  update: [
    orderExists,
    bodyHasDeliverTo,
    bodyHasMobileNumber,
    bodyHasDishes,
    dishesHaveValidQuantity,
    validateIdMatch,
    validateStatus,
    update,
  ],
  delete: [orderExists, destroy],
};

