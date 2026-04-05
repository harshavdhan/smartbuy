import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "@/lib/api";

const initialState = {
  isLoading: false,
  orderId: null,
  orderList: [],
  orderDetails: null,
};

export const createNewOrder = createAsyncThunk(
  "/order/createNewOrder",
  async (orderData, { rejectWithValue }) => {
    try {
      const response = await api.post("/shop/order/create", orderData);

      return response.data;
    } catch (error) {
      return rejectWithValue(error?.response?.data || { message: "Failed to create order" });
    }
  }
);

export const verifyRazorpayPayment = createAsyncThunk(
  "/order/verifyRazorpayPayment",
  async (paymentData, { rejectWithValue }) => {
    try {
      const response = await api.post("/shop/order/verify-payment", paymentData);

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data || { message: "Failed to verify payment" }
      );
    }
  }
);

export const getAllOrdersByUserId = createAsyncThunk(
  "/order/getAllOrdersByUserId",
  async (userId) => {
    const response = await api.get(`/shop/order/list/${userId}`);

    return response.data;
  }
);

export const getOrderDetails = createAsyncThunk(
  "/order/getOrderDetails",
  async (id) => {
    const response = await api.get(`/shop/order/details/${id}`);

    return response.data;
  }
);

const shoppingOrderSlice = createSlice({
  name: "shoppingOrderSlice",
  initialState,
  reducers: {
    resetOrderDetails: (state) => {
      state.orderDetails = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createNewOrder.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createNewOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orderId = action.payload.orderId;
      })
      .addCase(createNewOrder.rejected, (state) => {
        state.isLoading = false;
        state.orderId = null;
      })
      .addCase(verifyRazorpayPayment.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(verifyRazorpayPayment.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orderId = action.payload.orderId;
      })
      .addCase(verifyRazorpayPayment.rejected, (state) => {
        state.isLoading = false;
      })
      .addCase(getAllOrdersByUserId.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getAllOrdersByUserId.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orderList = action.payload.data;
      })
      .addCase(getAllOrdersByUserId.rejected, (state) => {
        state.isLoading = false;
        state.orderList = [];
      })
      .addCase(getOrderDetails.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getOrderDetails.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orderDetails = action.payload.data;
      })
      .addCase(getOrderDetails.rejected, (state) => {
        state.isLoading = false;
        state.orderDetails = null;
      });
  },
});

export const { resetOrderDetails } = shoppingOrderSlice.actions;

export default shoppingOrderSlice.reducer;
