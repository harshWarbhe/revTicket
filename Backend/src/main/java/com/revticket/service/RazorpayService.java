package com.revticket.service;

import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Utils;
import com.revticket.dto.RazorpayOrderRequest;
import com.revticket.dto.RazorpayOrderResponse;
import com.revticket.dto.RazorpayVerificationRequest;
import com.revticket.entity.Booking;
import com.revticket.entity.Payment;
import com.revticket.entity.Showtime;
import com.revticket.entity.User;
import com.revticket.repository.BookingRepository;
import com.revticket.repository.PaymentRepository;
import com.revticket.repository.ShowtimeRepository;
import com.revticket.repository.UserRepository;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class RazorpayService {

    @Value("${razorpay.key.id}")
    private String razorpayKeyId;

    @Value("${razorpay.key.secret}")
    private String razorpayKeySecret;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private ShowtimeRepository showtimeRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private com.revticket.repository.SeatRepository seatRepository;

    public RazorpayOrderResponse createOrder(RazorpayOrderRequest request) throws RazorpayException {
        RazorpayClient razorpayClient = new RazorpayClient(razorpayKeyId, razorpayKeySecret);

        JSONObject orderRequest = new JSONObject();
        orderRequest.put("amount", (int) (request.getAmount() * 100)); // Amount in paise
        orderRequest.put("currency", request.getCurrency());
        orderRequest.put("receipt", "order_" + System.currentTimeMillis());

        Order order = razorpayClient.orders.create(orderRequest);

        return new RazorpayOrderResponse(
                order.get("id"),
                order.get("currency"),
                order.get("amount"),
                razorpayKeyId);
    }

    @Transactional
    public Booking verifyPaymentAndCreateBooking(String userId, RazorpayVerificationRequest request) throws Exception {
        // Verify signature
        JSONObject options = new JSONObject();
        options.put("razorpay_order_id", request.getRazorpayOrderId());
        options.put("razorpay_payment_id", request.getRazorpayPaymentId());
        options.put("razorpay_signature", request.getRazorpaySignature());

        boolean isValidSignature = Utils.verifyPaymentSignature(options, razorpayKeySecret);

        if (!isValidSignature) {
            throw new RuntimeException("Invalid payment signature");
        }

        // Get user and showtime
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Showtime showtime = showtimeRepository.findById(request.getShowtimeId())
                .orElseThrow(() -> new RuntimeException("Showtime not found"));

        // Book seats
        List<com.revticket.entity.Seat> showtimeSeats = seatRepository.findByShowtimeId(request.getShowtimeId());
        for (String seatId : request.getSeats()) {
            com.revticket.entity.Seat seat = showtimeSeats.stream()
                    .filter(s -> seatId.equals(s.getId()))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Seat not found: " + seatId));

            if (seat.getIsBooked()) {
                throw new RuntimeException("Seat is already booked");
            }

            seat.setIsBooked(true);
            seat.setIsHeld(false);
            seat.setHoldExpiry(null);
            seat.setSessionId(null);
            seatRepository.save(seat);
        }

        showtime.setAvailableSeats(Math.max(0, showtime.getAvailableSeats() - request.getSeats().size()));
        showtimeRepository.save(showtime);

        // Create booking
        Booking booking = new Booking();
        booking.setUser(user);
        booking.setShowtime(showtime);
        booking.setSeats(request.getSeats());
        booking.setSeatLabels(request.getSeatLabels());
        booking.setTotalAmount(request.getTotalAmount());
        booking.setCustomerName(request.getCustomerName());
        booking.setCustomerEmail(request.getCustomerEmail());
        booking.setCustomerPhone(request.getCustomerPhone());
        booking.setStatus(Booking.BookingStatus.CONFIRMED);
        booking.setTicketNumber("TKT-" + System.currentTimeMillis());
        booking.setPaymentMethod("RAZORPAY");

        booking = bookingRepository.save(booking);

        // Create payment record
        Payment payment = new Payment();
        payment.setBooking(booking);
        payment.setAmount(request.getTotalAmount());
        payment.setPaymentMethod(Payment.PaymentMethod.UPI);
        payment.setStatus(Payment.PaymentStatus.SUCCESS);
        payment.setRazorpayOrderId(request.getRazorpayOrderId());
        payment.setRazorpayPaymentId(request.getRazorpayPaymentId());
        payment.setRazorpaySignature(request.getRazorpaySignature());
        payment.setTransactionId(request.getRazorpayPaymentId());

        paymentRepository.save(payment);

        return booking;
    }

    @Transactional
    public void handlePaymentFailure(String userId, RazorpayVerificationRequest request) {
        // Log failed payment attempt
        User user = userRepository.findById(userId).orElse(null);
        if (user != null) {
            Showtime showtime = showtimeRepository.findById(request.getShowtimeId()).orElse(null);
            if (showtime != null) {
                Booking booking = new Booking();
                booking.setUser(user);
                booking.setShowtime(showtime);
                booking.setSeats(request.getSeats());
                booking.setSeatLabels(request.getSeatLabels());
                booking.setTotalAmount(request.getTotalAmount());
                booking.setCustomerName(request.getCustomerName());
                booking.setCustomerEmail(request.getCustomerEmail());
                booking.setCustomerPhone(request.getCustomerPhone());
                booking.setStatus(Booking.BookingStatus.CANCELLED);
                booking.setPaymentMethod("RAZORPAY");

                booking = bookingRepository.save(booking);

                Payment payment = new Payment();
                payment.setBooking(booking);
                payment.setAmount(request.getTotalAmount());
                payment.setPaymentMethod(Payment.PaymentMethod.UPI);
                payment.setStatus(Payment.PaymentStatus.FAILED);
                payment.setRazorpayOrderId(request.getRazorpayOrderId());

                paymentRepository.save(payment);
            }
        }
    }
}
