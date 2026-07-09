package com.zenware.skillsharebackend.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.Transformation;
import com.cloudinary.utils.ObjectUtils;
import com.zenware.skillsharebackend.entity.User;
import com.zenware.skillsharebackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class FileUploadService {

    private final Cloudinary cloudinary;
    private final UserRepository userRepository;

    // --- ZERO-TRUST SECURITY ENGINE ---
    private User getAuthenticatedUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Authenticated user not found!"));
    }

    public String uploadProfilePicture(MultipartFile file) throws IOException {
        User user = getAuthenticatedUser();

        // 1. THE CLEANUP PHASE: Destroy the old image if it exists
        if (user.getProfilePicturePublicId() != null) {
            try {
                cloudinary.uploader().destroy(user.getProfilePicturePublicId(), ObjectUtils.emptyMap());
                System.out.println("Cleaned up old profile picture from cloud storage.");
            } catch (Exception e) {
                // We catch this so if the deletion fails for some reason,
                // it doesn't crash the user's attempt to upload a new photo!
                System.err.println("Failed to delete old image from Cloudinary: " + e.getMessage());
            }
        }

        // 2. Upload the new raw file bytes to Cloudinary
        Map uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.emptyMap());
        String newPublicId = (String) uploadResult.get("public_id");

        // 3. Ask Cloudinary for the perfectly cropped, compressed circular version
        String optimizedUrl = cloudinary.url()
                .transformation(new Transformation()
                        .quality("auto")
                        .fetchFormat("auto")
                        .width(250)
                        .height(250)
                        .crop("fill")
                        .gravity("face")
                        .radius("max"))
                .generate(newPublicId);

        // 4. Save BOTH the perfectly formatted URL and the tracking ID to PostgreSQL
        user.setProfilePictureUrl(optimizedUrl);
        user.setProfilePicturePublicId(newPublicId);
        userRepository.save(user);

        return optimizedUrl;
    }
}