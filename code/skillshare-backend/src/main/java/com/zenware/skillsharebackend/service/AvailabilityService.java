package com.zenware.skillsharebackend.service;

import com.zenware.skillsharebackend.dto.AvailabilityRequest;
import com.zenware.skillsharebackend.entity.Availability;
import com.zenware.skillsharebackend.entity.User;
import com.zenware.skillsharebackend.repository.AvailabilityRepository;
import com.zenware.skillsharebackend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class AvailabilityService {

    @Autowired
    private AvailabilityRepository availabilityRepository;

    @Autowired
    private UserRepository userRepository;

    public Availability addAvailability(AvailabilityRequest request) {
        // Business Logic 1: Time Travel Check!
        // A mentor cannot say their free time ends before it even begins.
        if (request.getStartTime().isAfter(request.getEndTime())) {
            throw new IllegalArgumentException("Start time must be before end time!");
        }

        // Business Logic 2: Fetch the actual User from the database
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("User not found!"));

        // Business Logic 3: Build the actual Entity and save it
        Availability availability = new Availability();
        availability.setUser(user);
        availability.setStartTime(request.getStartTime());
        availability.setEndTime(request.getEndTime());
        // isBooked is already false by default in the Entity

        return availabilityRepository.save(availability);
    }

    public List<Availability> getMentorFreeSlots(UUID mentorId) {
        // Just ask the repository for the unbooked slots!
        return availabilityRepository.findByUserIdAndIsBookedFalse(mentorId);
    }
}