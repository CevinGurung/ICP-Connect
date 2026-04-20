package com.icpconnect.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LikedUserDTO {
    private Long id;
    private String fullName;
    private String program;
    private String year;
}
