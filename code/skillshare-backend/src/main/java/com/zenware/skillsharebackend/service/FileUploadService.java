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

        // 1. Send the raw file bytes to Cloudinary
        Map uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.emptyMap());
        String publicId = (String) uploadResult.get("public_id");

        // 2. Ask Cloudinary for the perfectly cropped, compressed circular version
        String optimizedUrl = cloudinary.url()
                .transformation(new Transformation()
                        .quality("auto")
                        .fetchFormat("auto")
                        .width(250)
                        .height(250)
                        .crop("fill")
                        .gravity("face")
                        .radius("max"))
                .generate(publicId);

        // 3. Save that perfectly formatted URL to PostgreSQL
        user.setProfilePictureUrl(optimizedUrl);
        userRepository.save(user);

        return optimizedUrl;
    }
}