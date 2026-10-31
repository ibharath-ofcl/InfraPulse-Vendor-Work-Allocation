package com.infrapulse.modules.dashboard.dto;

import java.util.List;

public record ProjectProgressResponse(
    List<ProjectProgressItem> projects
) {}
