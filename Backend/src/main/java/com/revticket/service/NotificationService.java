package com.revticket.service;

import com.mongodb.client.ChangeStreamIterable;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.model.changestream.ChangeStreamDocument;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.util.concurrent.CompletableFuture;

@Service
public class NotificationService {

    @Autowired
    private MongoTemplate mongoTemplate;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @PostConstruct
    public void startChangeStreams() {
        CompletableFuture.runAsync(this::watchReviewChanges);
        CompletableFuture.runAsync(this::watchBookingChanges);
    }

    private void watchReviewChanges() {
        try {
            MongoCollection<Document> collection = mongoTemplate.getCollection("reviews");
            ChangeStreamIterable<Document> changeStream = collection.watch();
            
            for (ChangeStreamDocument<Document> change : changeStream) {
                String operationType = change.getOperationType().getValue();
                Document fullDocument = change.getFullDocument();
                
                if ("insert".equals(operationType) && fullDocument != null) {
                    // New review submitted
                    messagingTemplate.convertAndSend("/topic/admin/reviews", 
                        "New review submitted for approval");
                } else if ("update".equals(operationType) && fullDocument != null) {
                    // Review approved/updated
                    Boolean approved = fullDocument.getBoolean("approved");
                    if (Boolean.TRUE.equals(approved)) {
                        messagingTemplate.convertAndSend("/topic/reviews", 
                            "Review approved for movie: " + fullDocument.getString("movieTitle"));
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Error in review change stream: " + e.getMessage());
        }
    }

    private void watchBookingChanges() {
        try {
            MongoCollection<Document> collection = mongoTemplate.getCollection("bookings");
            ChangeStreamIterable<Document> changeStream = collection.watch();
            
            for (ChangeStreamDocument<Document> change : changeStream) {
                String operationType = change.getOperationType().getValue();
                Document fullDocument = change.getFullDocument();
                
                if ("insert".equals(operationType) && fullDocument != null) {
                    // New booking created
                    messagingTemplate.convertAndSend("/topic/bookings", 
                        "Seat availability updated");
                } else if ("update".equals(operationType) && fullDocument != null) {
                    // Booking status changed
                    messagingTemplate.convertAndSend("/topic/bookings", 
                        "Booking status updated");
                }
            }
        } catch (Exception e) {
            System.err.println("Error in booking change stream: " + e.getMessage());
        }
    }

    public void notifyReviewSubmitted(String movieTitle) {
        messagingTemplate.convertAndSend("/topic/admin/reviews", 
            "New review submitted for: " + movieTitle);
    }

    public void notifyMaintenanceMode(boolean enabled) {
        messagingTemplate.convertAndSend("/topic/maintenance", 
            enabled ? "Maintenance mode enabled" : "Maintenance mode disabled");
    }
}