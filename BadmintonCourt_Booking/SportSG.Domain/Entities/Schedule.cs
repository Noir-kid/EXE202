using SportSG.Domain.Enums;

namespace SportSG.Domain.Entities;

/// <summary>Recurring weekly schedule for a branch (open/close per day of week).</summary>
public class Schedule
{
    public int ScheduleId { get; set; }
    public Guid BranchId { get; set; }
    public DayOfWeek DayOfWeek { get; set; }
    public TimeOnly OpenTime { get; set; }
    public TimeOnly CloseTime { get; set; }
    public bool IsClosed { get; set; }              // Closed on this day

    public Branch Branch { get; set; } = null!;
}

/// <summary>One-off closed dates (public holidays, maintenance days).</summary>
public class Holiday
{
    public int HolidayId { get; set; }
    public Guid? BranchId { get; set; }             // null = platform-wide
    public DateOnly Date { get; set; }
    public string Reason { get; set; } = null!;
    public bool IsRecurringYearly { get; set; }

    public Branch? Branch { get; set; }
}
