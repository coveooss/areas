#!/usr/bin/env ruby
# frozen_string_literal: true

require 'json'

fixtures_path = File.join(__dir__, 'path_matcher_fixtures.json')
fixtures = JSON.parse(File.read(fixtures_path))

puts "--- Testing Pattern Matching Rules ---"

failed = false

fixtures.each do |test_case|
  pattern = test_case['pattern']
  path = test_case['path']
  should_match = test_case['match']
  description = test_case['description'] || pattern

  matches = File.fnmatch?(pattern, path, File::FNM_PATHNAME | File::FNM_DOTMATCH)

  if matches == should_match
    # success
    puts "PASS: #{description} - '#{pattern}' against '#{path}'"
  else
    puts "FAIL: #{description} - '#{pattern}' against '#{path}'"
    puts "  Expected match: #{should_match}, Got: #{matches}"
    failed = true
  end
end

if failed
  exit 1
else
  puts "All tests passed."
end
