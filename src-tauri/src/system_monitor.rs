use serde::Serialize;
use sysinfo::{System, Disks, Networks};

#[derive(Debug, Serialize)]
pub struct SystemStats {
    pub cpu_usage: f32,
    pub memory_used: u64,
    pub memory_total: u64,
    pub memory_percent: f32,
    pub disk_used: u64,
    pub disk_total: u64,
    pub disk_percent: f32,
    pub network_received: u64,
    pub network_transmitted: u64,
}

pub fn get_system_stats() -> SystemStats {
    let mut sys = System::new_all();
    sys.refresh_all();

    // CPU usage
    let cpu_usage = sys.global_cpu_info().cpu_usage();

    // Memory usage
    let memory_total = sys.total_memory();
    let memory_used = sys.used_memory();
    let memory_percent = if memory_total > 0 {
        (memory_used as f32 / memory_total as f32) * 100.0
    } else {
        0.0
    };

    // Disk usage (primary disk)
    let disks = Disks::new_with_refreshed_list();
    let (disk_total, disk_used) = disks
        .iter()
        .next()
        .map(|disk| {
            let total = disk.total_space();
            let available = disk.available_space();
            let used = total.saturating_sub(available);
            (total, used)
        })
        .unwrap_or((0, 0));

    let disk_percent = if disk_total > 0 {
        (disk_used as f32 / disk_total as f32) * 100.0
    } else {
        0.0
    };

    // Network usage
    let networks = Networks::new_with_refreshed_list();
    let mut network_received = 0u64;
    let mut network_transmitted = 0u64;

    for (_interface_name, network) in &networks {
        network_received += network.received();
        network_transmitted += network.transmitted();
    }

    SystemStats {
        cpu_usage,
        memory_used,
        memory_total,
        memory_percent,
        disk_used,
        disk_total,
        disk_percent,
        network_received,
        network_transmitted,
    }
}
