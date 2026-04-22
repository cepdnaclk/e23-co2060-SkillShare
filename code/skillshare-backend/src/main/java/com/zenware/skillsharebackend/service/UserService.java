package com.zenware.skillsharebackend.service;

import com.zenware.skillsharebackend.entity.User;
import com.zenware.skillsharebackend.repository.SkillRepository;
import com.zenware.skillsharebackend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SkillRepository skillRepository;

    public User registerNewUser(User user) {
        // Business Logic 1: Check if email already exists
        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
                throw new IllegalArgumentException("Email is already taken!");
        }

        // Business Logic 2: (Later, we will hash the password here)

        // Business Logic 3: Ensure they start with exactly 100 credits
        user.setCredits(100);

        // Finally, save and return
        return userRepository.save(user);
    }



}